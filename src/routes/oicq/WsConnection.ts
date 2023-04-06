import { v4 as uuid } from "uuid";
import { RawData, WebSocket } from "ws";

import OicqClient from "./OicqClient";
import UserManager from "./UserManager";

import { getSystemInfo, parseWsMessage } from "../../utils";
import {
  OicqAccount,
  UserId,
  UUID,
  WsAction,
  WsFailureResponse,
  WsRequest,
  WsResponse,
  WsSuccessResponse,
} from "../../types";

type MessageHandler = (wsMessage: WsRequest) => Promise<void>;
type ClientMap = Map<OicqAccount, OicqClient | undefined>;
type HandlerMap = Map<WsAction, MessageHandler>;

export default class WsConnection {
  readonly wsId: UUID = uuid();
  userId: UserId;
  private socket: WebSocket;
  private clientMap: ClientMap = new Map<OicqAccount, OicqClient | undefined>();
  private readonly handlerMap: HandlerMap = new Map<WsAction, MessageHandler>();

  constructor(userId: UserId, ws: WebSocket) {
    this.userId = userId;
    this.socket = ws;

    this.socket.on("message", async (message) => {
      await this.handleMessage(message);
    });
    this.socket.on("close", () => {
      this.clientMap.forEach((client) => {
        client?.unsubscribe(this.wsId);
      });
      console.log("[Close]Connection's client map size: ", this.clientMap.size);
    });

    this.handlerMap.set(WsAction.Monitor, this.monitorHandler);
    this.handlerMap.set(WsAction.List, this.listHandler);
    this.handlerMap.set(WsAction.Subscribe, this.subscribeHandler);
    this.handlerMap.set(WsAction.Login, this.loginHandler);
    this.handlerMap.set(WsAction.Message, this.messageHandler);
  }

  subscribe(client: OicqClient) {
    this.clientMap.set(client.account, client);
    console.log(
      "[Subscribe]Connection's client map size: ",
      this.clientMap.size
    );
  }

  respond(wsResponse: WsResponse) {
    if (wsResponse.result === "error") {
      this.socket.close(1011, wsResponse.toString());
    } else {
      this.socket.send(wsResponse.toString());
    }
  }

  private async handleMessage(message: RawData) {
    try {
      const wsMessage = parseWsMessage(message.toString());
      await this.handlerMap.get(wsMessage.action)!.call(this, wsMessage);
    } catch (error: any) {
      this.respond(error as WsResponse);
    }
  }

  private async monitorHandler(wsMessage: WsRequest) {
    this.respond(
      WsSuccessResponse.fromRequest(wsMessage, await getSystemInfo())
    );
  }

  private async listHandler(wsMessage: WsRequest) {
    this.respond(
      WsSuccessResponse.fromRequest(wsMessage, UserManager.listClients(this))
    );
  }

  private async subscribeHandler(wsMessage: WsRequest) {
    const { account } = wsMessage.data;
    this.respond(
      WsSuccessResponse.fromRequest(
        wsMessage,
        UserManager.connectClient(this, account)
      )
    );
  }

  private async loginHandler(wsMessage: WsRequest) {
    const { account, payload } = wsMessage.data;
    const client = this.clientMap.get(account);
    if (client === undefined) {
      this.respond(
        WsFailureResponse.fromRequest(wsMessage, "Client not found", [
          "Subscribe to the account first",
        ])
      );
      return;
    }
    try {
      client.login(payload);
    } catch (error) {
      this.respond(error as WsFailureResponse);
    }
  }

  private async messageHandler(wsMessage: WsRequest) {
    const wsResponse = WsSuccessResponse.fromRequest(wsMessage);
    this.respond(wsResponse);
  }
}
