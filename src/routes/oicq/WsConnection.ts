import { v4 as uuid } from "uuid";
import { WebSocket } from "ws";
import OicqClient from "./OicqClient";
import UserManager from "./UserManager";
import {
  UserId,
  UUID,
  WsAction,
  WsMessage,
} from "./types";

export default class WsConnection {
  readonly wsId: UUID = uuid();
  private socket: WebSocket;
  userId: UserId;
  clients: Array<OicqClient | undefined> = [];

  constructor(userId: UserId, ws: WebSocket) {
    this.userId = userId;
    ws.on("close", () => {
      this.clients.forEach((client) => {
        client?.unsubscribe(this.wsId);
      });
    });
    this.socket = ws;
  }

  send(data: string) {
    this.socket.send(data);
  }

  handleMessage(message: WsMessage): void {
    switch (message.action) {
      case WsAction.Subscribe:
        const { account } = message.data;
        UserManager.connectClient(this, account);
        break;
      case WsAction.Login:
        break;
      case WsAction.Validate:
        break;
      case WsAction.Message:
        break;
    }
  }
}
