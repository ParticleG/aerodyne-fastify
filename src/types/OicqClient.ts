import { createClient } from 'icqq';
import { Client } from 'icqq/lib/client';
import { Platform } from 'icqq/lib/core';
import {
  DiscussMessageEvent,
  GroupMessageEvent,
  PrivateMessageEvent,
} from 'icqq/lib/events';

import { WsConnection } from './WsConnection';
import { OicqAccount, UserId, WsId } from './common';
import { ClientState } from './ClientState';
import { WsSuccessResponse } from './WsSuccessResponse';
import { WsAction } from './WsAction';
import { WsFailureResponse } from './WsFailureResponse';
import { WsResponse } from './WsResponse';

export class OicqClient {
  readonly account: OicqAccount;
  state: ClientState;
  private allowedUsers: UserId[] = [];
  private client: Client;
  private connectionMap: Map<WsId, WsConnection> = new Map<
    WsId,
    WsConnection
  >();

  constructor(platform: Platform, account: OicqAccount) {
    this.client = createClient({ log_level: 'warn', platform: platform });
    this.state = ClientState.Initializing;
    this.account = account;

    this.client.on(
      'message',
      (
        event: PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent
      ) => {
        this.broadcast(new WsSuccessResponse(WsAction.Message, event));
      }
    );

    this.client.on(
      'system.login.device',
      (event: { url: string; phone: string }) => {
        this.state = ClientState.WaitingSmsCode;
        this.client.sendSmsCode();
        this.broadcast(new WsSuccessResponse(WsAction.Login, event));
      }
    );
    this.client.on('system.login.qrcode', (event: { image: Buffer }) => {
      this.state = ClientState.WaitingQRCode;
      this.broadcast(new WsSuccessResponse(WsAction.Login, event));
    });
    this.client.on('system.login.slider', (event: { url: string }) => {
      this.state = ClientState.WaitingSlider;
      this.broadcast(new WsSuccessResponse(WsAction.Login, event));
    });
    this.client.on('system.login.error', ({ code, message }) => {
      this.state = ClientState.Initializing;

      this.broadcast(
        new WsFailureResponse(WsAction.Login, message, [
          JSON.stringify({ code: code }),
        ])
      );
    });

    this.client.on('system.online', () => {
      this.state = ClientState.Online;
      this.broadcast(new WsSuccessResponse(WsAction.Login));
    });
    this.client.on('system.offline.kickoff', ({ message }) => {
      this.state = ClientState.Offline;
      this.broadcast(
        new WsFailureResponse(WsAction.Logout, message, ['Kicked off'])
      );
    });
    this.client.on('system.offline.network', ({ message }) => {
      this.state = ClientState.Offline;
      this.broadcast(
        new WsFailureResponse(WsAction.Logout, message, ['Network'])
      );
    });
  }

  validate(wsConnection: WsConnection): boolean {
    if (this.allowedUsers.length === 0) {
      this.allowedUsers.push(wsConnection.userId);
    }
    return wsConnection.userId in this.allowedUsers;
  }

  subscribe(wsConnection: WsConnection): ClientState | undefined {
    if (this.validate(wsConnection)) {
      this.connectionMap.set(wsConnection.wsId, wsConnection);
      wsConnection.subscribe(this);
      console.log(
        "[Subscribe]Client's subscriber map size: ",
        this.connectionMap.size
      );
      return this.state;
    }
    return undefined;
  }

  unsubscribe(wsId: WsId) {
    this.connectionMap.delete(wsId);
    console.log(
      "[Unsubscribe]Client's subscriber map size: ",
      this.connectionMap.size
    );
  }

  login(payload?: string) {
    switch (this.state) {
      case ClientState.Initializing: {
        this.client.login(this.account, payload).then();
        break;
      }
      case ClientState.WaitingSmsCode: {
        if (!payload) {
          throw new WsFailureResponse(WsAction.Login, 'Missing sms code', [
            JSON.stringify({ state: this.state }),
          ]);
        }
        this.client.submitSmsCode(payload.trim()).then();
        break;
      }
      case ClientState.WaitingQRCode: {
        this.client.login().then();
        break;
      }
      case ClientState.WaitingSlider: {
        if (!payload) {
          throw new WsFailureResponse(WsAction.Login, 'Missing login ticket', [
            JSON.stringify({ state: this.state }),
          ]);
        }
        this.client.submitSlider(payload.trim()).then();
        break;
      }
      case ClientState.Online: {
        throw new WsFailureResponse(WsAction.Login, 'Already online', [
          JSON.stringify({ state: this.state }),
        ]);
      }
    }
  }

  broadcast(wsResponse: WsResponse) {
    if (wsResponse.data === undefined) {
      wsResponse.data = {};
    }
    wsResponse.data.state = this.state;
    this.connectionMap.forEach((connection) => {
      connection.respond(wsResponse);
    });
  }
}
