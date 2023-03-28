import { Client } from "icqq/lib/client";
import { ClientState, OicqAccount, UUID, WsAction } from "./types";
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
      this.broadcast(WsAction.Message, e);
    });

    this.client.on("system.login.device", (e: any) => {
      this.state = ClientState.WaitingSmsCode;
      this.client.sendSmsCode();
      this.broadcast(WsAction.Login, e);
    });
    this.client.on("system.login.qrcode", (e: any) => {
      this.state = ClientState.WaitingQRCode;
      this.broadcast(WsAction.Login, e);
    });
    this.client.on("system.login.slider", (e: any) => {
      this.state = ClientState.WaitingSlider;
      this.broadcast(WsAction.Login, e);
    });
    this.client.on("system.online", () => {
      this.state = ClientState.Online;
      this.broadcast(WsAction.Login);
    });
    this.client.on("system.login.error", (e: any) => {
      this.state = ClientState.Initializing;
      this.broadcast(WsAction.Login, e);
    });
  }

  subscribe(wsConnection: WsConnection) {
    wsConnection.clients.push(this);
    this.socketMap.set(wsConnection.wsId, wsConnection);
  }

  unsubscribe(wsId: UUID) {
    this.socketMap.delete(wsId);
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

  private broadcast(action: WsAction, data?: any) {
    const message = JSON.stringify({
      action: action,
      data: data,
      state: this.state,
    });
    this.socketMap.forEach((socket) => {
      socket.send(message);
    });
  }
}