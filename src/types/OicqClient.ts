import { createClient, Friend, Group, Message } from 'icqq';
import { Client } from 'icqq/lib/client';
import { Platform } from 'icqq/lib/core';
import {
  DiscussMessageEvent,
  GroupMessageEvent,
  PrivateMessageEvent,
} from 'icqq/lib/events';

import {
  FriendCache,
  GroupCache,
  newFriendCache,
  newGroupCache,
} from 'src/types/caches';
import { OicqAccount, UserId, WsId } from 'src/types/common';
import { ClientState } from 'src/types/ClientState';
import { WsAction } from 'src/types/WsAction';
import { WsConnection } from 'src/types/WsConnection';
import { WsFailureResponse } from 'src/types/WsFailureResponse';
import { WsResponse } from 'src/types/WsResponse';
import { WsSuccessResponse } from 'src/types/WsSuccessResponse';
import { Logger } from 'src/types/Logger';
import { ClientInfo, FriendData, GroupData } from 'src/types/ClientInfo';

export class OicqClient {
  readonly account: OicqAccount;
  state: ClientState;
  private allowedUsers: UserId[] = [];
  private readonly client: Client;
  private connectionMap = new Map<WsId, WsConnection>();

  private friendCaches = new Map<number, FriendCache>();
  private groupCaches = new Map<number, GroupCache>();

  private friendList = new Map<number, Friend>();
  private groupList = new Map<number, Group>();

  constructor(platform: Platform, account: OicqAccount) {
    this.client = createClient({ log_level: 'warn', platform: platform });
    this.state = ClientState.Initializing;
    this.account = account;

    this.client.on(
      'message',
      (
        event: PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent
      ) => {
        this.broadcast(
          new WsSuccessResponse(WsAction.Message, this.account, {
            account: this.account,
            message: event as Message,
          })
        );
      }
    );

    this.client.on(
      'system.login.device',
      (event: { url: string; phone: string }) => {
        this.state = ClientState.WaitingSmsCode;
        this.client.sendSmsCode();
        this.broadcast(
          new WsSuccessResponse(WsAction.Login, this.account, {
            state: this.state,
            ...event,
          })
        );
      }
    );
    this.client.on('system.login.qrcode', (event: { image: Buffer }) => {
      this.state = ClientState.WaitingQRCode;
      this.broadcast(
        new WsSuccessResponse(WsAction.Login, this.account, {
          state: this.state,
          ...event,
        })
      );
    });
    this.client.on('system.login.slider', (event: { url: string }) => {
      this.state = ClientState.WaitingSlider;
      this.broadcast(
        new WsSuccessResponse(WsAction.Login, this.account, {
          state: this.state,
          ...event,
        })
      );
    });
    this.client.on('system.login.error', ({ code, message }) => {
      this.state = ClientState.Initializing;

      this.broadcast(
        new WsFailureResponse(WsAction.Login, this.account, message, [
          JSON.stringify({ code: code }),
        ])
      );
    });

    this.client.on('system.online', () => {
      this.state = ClientState.Online;
      Logger.info('OICQ', `[${this.account}] Loading friend info...`);
      this.client.fl.forEach((friendInfo) => {
        if (!this.friendList.has(friendInfo.user_id)) {
          this.friendList.set(
            friendInfo.user_id,
            this.client.pickFriend(friendInfo.user_id)
          );
        }
        if (!this.friendCaches.has(friendInfo.user_id)) {
          newFriendCache(this.friendList.get(friendInfo.user_id)!).then(
            (friendCache) =>
              this.friendCaches.set(friendInfo.user_id, friendCache)
          );
        }
      });
      Logger.info('OICQ', `[${this.account}] Loading group info...`);
      this.client.gl.forEach((groupInfo) => {
        if (!this.groupList.has(groupInfo.group_id)) {
          this.groupList.set(
            groupInfo.group_id,
            this.client.pickGroup(groupInfo.group_id)
          );
        }
        if (!this.groupCaches.has(groupInfo.group_id)) {
          newGroupCache(this.groupList.get(groupInfo.group_id)!).then(
            (groupCache) => this.groupCaches.set(groupInfo.group_id, groupCache)
          );
        }
      });
      this.broadcast(new WsSuccessResponse(WsAction.Login));
    });

    this.client.on('system.offline.kickoff', ({ message }) => {
      this.state = ClientState.Offline;
      this.broadcast(
        new WsFailureResponse(WsAction.Logout, this.account, message, [
          'Kicked off',
        ])
      );
    });
    this.client.on('system.offline.network', ({ message }) => {
      this.state = ClientState.Offline;
      this.broadcast(
        new WsFailureResponse(WsAction.Logout, this.account, message, [
          'Network',
        ])
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
          throw new WsFailureResponse(
            WsAction.Login,
            this.account,
            'Missing sms code',
            [JSON.stringify({ state: this.state })]
          );
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
          throw new WsFailureResponse(
            WsAction.Login,
            this.account,
            'Missing login ticket',
            [JSON.stringify({ state: this.state })]
          );
        }
        this.client.submitSlider(payload.trim()).then();
        break;
      }
      case ClientState.Online: {
        throw new WsFailureResponse(
          WsAction.Login,
          this.account,
          'Already online',
          [JSON.stringify({ state: this.state })]
        );
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

  getInfo(): ClientInfo {
    return {
      account: this.client.uin,
      status: this.client.status,
      nickname: this.client.nickname,
      sex: this.client.sex,
      age: this.client.age,
      friendList: Array.from(this.client.fl).map(([id, friend]) => {
        const friendCache = this.friendCaches.get(id);
        if (!friendCache) {
          newFriendCache(this.friendList.get(id)!).then((friendCache) =>
            this.friendCaches.set(id, friendCache)
          );
        }
        return <FriendData>{
          ...friend,
          ...friendCache,
        };
      }),
      groupList: Array.from(this.client.gl).map(([id, group]) => {
        const groupCache = this.groupCaches.get(id);
        if (!groupCache) {
          newGroupCache(this.groupList.get(id)!).then((groupCache) =>
            this.groupCaches.set(id, groupCache)
          );
        }
        return <GroupData>{
          ...group,
          ...groupCache,
        };
      }),
    };
  }
}
