import { createClient } from "icqq";
import { Client } from "icqq/lib/client";
import { Platform } from "icqq/lib/core";
import {
  DiscussMessageEvent,
  GroupMessageEvent,
  PrivateMessageEvent,
} from "icqq/lib/events";

import WsConnection from "./WsConnection";
import {
  ClientState,
  OicqAccount,
  UUID,
  WsAction,
  WsFailureResponse,
  WsResponse,
  WsSuccessResponse,
} from "./types";

export default class OicqClient {
  private client: Client;
  state: ClientState;
  readonly account: OicqAccount;
  private connectionMap: Map<UUID, WsConnection> = new Map<
    UUID,
    WsConnection
  >();

  constructor(platform: Platform, account: OicqAccount) {
    this.client = createClient({ log_level: "warn", platform: platform });
    this.state = ClientState.Offline;
    this.account = account;

    this.client.on(
      "message",
      (
        event: PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent
      ) => {
        this.broadcast(new WsSuccessResponse(WsAction.Message, event));
      }
    );

    this.client.on(
      "system.login.device",
      (event: { url: string; phone: string }) => {
        this.state = ClientState.WaitingSmsCode;
        this.client.sendSmsCode();
        this.broadcast(new WsSuccessResponse(WsAction.Login, event));
      }
    );
    this.client.on("system.login.qrcode", (event: { image: Buffer }) => {
      this.state = ClientState.WaitingQRCode;
      this.broadcast(new WsSuccessResponse(WsAction.Login, event));
    });
    this.client.on("system.login.slider", (event: { url: string }) => {
      this.state = ClientState.WaitingSlider;
      this.broadcast(new WsSuccessResponse(WsAction.Login, event));
    });
    this.client.on("system.login.error", ({ code, message }) => {
      this.state = ClientState.Offline;
      this.broadcast(
        new WsFailureResponse(WsAction.Login, message, [
          JSON.stringify({ code: code }),
        ])
      );
    });

    this.client.on("system.online", () => {
      this.state = ClientState.Online;
      this.broadcast(new WsSuccessResponse(WsAction.Login));
    });
    this.client.on("system.offline.kickoff", ({ message }) => {
      this.state = ClientState.Offline;
      this.broadcast(
        new WsFailureResponse(WsAction.Logout, message, ["Kicked off"])
      );
    });
    this.client.on("system.offline.network", ({ message }) => {
      this.state = ClientState.Offline;
      this.broadcast(
        new WsFailureResponse(WsAction.Logout, message, ["Network"])
      );
    });
  }

  subscribe(wsConnection: WsConnection): boolean {
    const hasConnection = this.connectionMap.has(wsConnection.wsId);
    this.connectionMap.set(wsConnection.wsId, wsConnection);
    wsConnection.subscribe(this);
    console.log(
      "[Subscribe]Client's subscriber map size: ",
      this.connectionMap.size
    );
    return !hasConnection;
  }

  unsubscribe(wsId: UUID) {
    this.connectionMap.delete(wsId);
    console.log(
      "[Unsubscribe]Client's subscriber map size: ",
      this.connectionMap.size
    );
  }

  login(payload?: string) {
    switch (this.state) {
      case ClientState.Offline: {
        this.client.login(this.account, payload).then();
        break;
      }
      case ClientState.WaitingSmsCode: {
        if (!payload) {
          throw new WsFailureResponse(WsAction.Login, "Missing sms code", [
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
          throw new WsFailureResponse(WsAction.Login, "Missing login ticket", [
            JSON.stringify({ state: this.state }),
          ]);
        }
        this.client.submitSlider(payload.trim()).then();
        break;
      }
      case ClientState.Online: {
        throw new WsFailureResponse(WsAction.Login, "Already online", [
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
