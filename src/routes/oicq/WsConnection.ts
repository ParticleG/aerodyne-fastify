import { v4 as uuid } from "uuid";
import { WebSocket } from "ws";

import OicqClient from "./OicqClient";
import UserManager from "./UserManager";

import { getSystemInfo, parseWsMessage } from "./utils";
import { OicqAccount, UserId, UUID, WsAction } from "./types";

type ClientMap = Map<OicqAccount, OicqClient | undefined>;

export default class WsConnection {
  readonly wsId: UUID = uuid();
  private socket: WebSocket;
  userId: UserId;
  clientMap: ClientMap = new Map<OicqAccount, OicqClient | undefined>();

  constructor(userId: UserId, ws: WebSocket) {
    this.userId = userId;
    ws.on("close", () => {
      console.log("Connection closed");
      this.clientMap.forEach((client) => {
        client?.unsubscribe(this.wsId);
      });
    });
    this.socket = ws;
    this.socket.on("message", async (message) => {
      try {
        const wsMessage = parseWsMessage(message.toString());
        console.log(JSON.stringify(wsMessage, null, 2));
        switch (wsMessage.action) {
          case WsAction.Monitor:
            this.send(
              JSON.stringify({
                action: wsMessage.action,
                data: await getSystemInfo(),
              })
            );
            break;
          case WsAction.Subscribe:
            const { account } = wsMessage.data;
            UserManager.connectClient(this, account);
            this.send(
              JSON.stringify({
                action: wsMessage.action,
                result: "success",
                data: await getSystemInfo(),
              })
            );
            break;
          case WsAction.Login:
            break;
          case WsAction.Validate:
            break;
          case WsAction.Message:
            break;
        }
      } catch (errorMessage: any) {
        if (errorMessage.isFatal) {
          this.socket.close(1011, errorMessage.toString());
        } else {
          this.socket.send(errorMessage.toString());
        }
      }
    });
  }

  send(message: string) {
    this.socket.send(message);
  }
}
