import { Client } from "icqq/lib/client";
import {
  ClientState,
  OicqAccount,
  UUID,
  WsAction,
  WsFailureResponse,
  WsResponse,
  WsSuccessResponse,
} from "./types";
import { Platform } from "icqq/lib/core";
import { createClient } from "icqq";
import WsConnection from "./WsConnection";

export default class OicqClient {
  private client: Client;
  state: ClientState;
  readonly account: OicqAccount;
  private socketMap: Map<UUID, WsConnection> = new Map<UUID, WsConnection>();

  constructor(platform: Platform, account: OicqAccount) {
    this.client = createClient({ log_level: "warn", platform: platform });
    this.state = ClientState.Initializing;
    this.account = account;

    this.client.on("message", (e: any) => {
      console.log(e);
      this.broadcast(new WsSuccessResponse(WsAction.Message, e));
    });

    this.client.on("system.login.device", (e: any) => {
      this.state = ClientState.WaitingSmsCode;
      this.client.sendSmsCode();
      this.broadcast(new WsSuccessResponse(WsAction.Login, e));
    });
    this.client.on("system.login.qrcode", (e: any) => {
      this.state = ClientState.WaitingQRCode;
      this.broadcast(new WsSuccessResponse(WsAction.Login, e));
    });
    this.client.on("system.login.slider", (e: any) => {
      this.state = ClientState.WaitingSlider;
      this.broadcast(new WsSuccessResponse(WsAction.Login, e));
    });
    this.client.on("system.online", () => {
      this.state = ClientState.Online;
      this.broadcast(new WsSuccessResponse(WsAction.Login));
    });
    this.client.on("system.login.error", (e: any) => {
      this.state = ClientState.Initializing;
      this.broadcast(new WsFailureResponse(WsAction.Login, e));
    });
  }

  subscribe(wsConnection: WsConnection) {
    wsConnection.subscribe(this);
    this.socketMap.set(wsConnection.wsId, wsConnection);
    console.log(
      "[Subscribe]Client's subscriber map size: ",
      this.socketMap.size
    );
  }

  unsubscribe(wsId: UUID) {
    this.socketMap.delete(wsId);
    console.log(
      "[Unsubscribe]Client's subscriber map size: ",
      this.socketMap.size
    );
  }

  login(account: OicqAccount, password?: string) {
    this.client.login(account, password).then();
  }

  postLogin(payload?: string) {
    switch (this.state) {
      case ClientState.WaitingSmsCode:
        if (!payload) {
          throw new Error("Missing Sms code");
        }
        this.client.submitSmsCode(payload.trim());
        break;
      case ClientState.WaitingQRCode:
        this.client.login().then();
        break;
      case ClientState.WaitingSlider:
        if (!payload) {
          throw new Error("Missing login ticket");
        }
        this.client.submitSlider(payload.trim());
        break;
    }
  }

  broadcast(wsResponse: WsResponse) {
    if (wsResponse.data === undefined) {
      wsResponse.data = {};
    }
    wsResponse.data.state = this.state;
    this.socketMap.forEach((socket) => {
      socket.send(wsResponse);
    });
  }
}
