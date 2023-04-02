import { v4 as uuid } from "uuid";
import { RawData, WebSocket } from "ws";

import OicqClient from "./OicqClient";
import UserManager from "./UserManager";

import { getSystemInfo, parseWsMessage } from "./utils";
import {
  OicqAccount,
  UserId,
  UUID,
  WsAction,
  WsRequest,
  WsResponse,
  WsSuccessResponse,
} from "./types";

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
    ws.on("close", () => {
      this.clientMap.forEach((client) => {
        client?.unsubscribe(this.wsId);
      });
      console.log("[Close]Connection's client map size: ", this.clientMap.size);
    });
    this.socket = ws;
    this.socket.on("message", async (message) => {
      await this.handleMessage(message);
    });

    this.handlerMap.set(WsAction.Monitor, this.monitorHandler);
    this.handlerMap.set(WsAction.Subscribe, this.subscribeHandler);
    this.handlerMap.set(WsAction.Login, this.loginHandler);
    this.handlerMap.set(WsAction.Validate, this.validateHandler);
    this.handlerMap.set(WsAction.Message, this.messageHandler);
  }

  subscribe(client: OicqClient) {
    this.clientMap.set(client.account, client);
    console.log(
      "[Subscribe]Connection's client map size: ",
      this.clientMap.size
    );
  }

  send(wsResponse: WsResponse) {
    this.socket.send(wsResponse.toString());
  }

  private async handleMessage(message: RawData) {
    try {
      const wsMessage = parseWsMessage(message.toString());
      await this.handlerMap.get(wsMessage.action)!.call(this, wsMessage);
    } catch (error: any) {
      const wsResponse = error as WsResponse;
      if (wsResponse.result === "error") {
        this.socket.close(1011, wsResponse.toString());
      } else {
        this.socket.send(wsResponse.toString());
      }
    }
  }

  private async monitorHandler(wsMessage: WsRequest) {
    const wsResponse = WsSuccessResponse.fromRequest(wsMessage);
    wsResponse.data = await getSystemInfo();
    this.send(wsResponse);
  }

  private async subscribeHandler(wsMessage: WsRequest) {
    const wsResponse = WsSuccessResponse.fromRequest(wsMessage);
    const { account } = wsMessage.data;
    UserManager.connectClient(this, account);
    this.send(wsResponse);
  }

  private async loginHandler(wsMessage: WsRequest) {
    const wsResponse = WsSuccessResponse.fromRequest(wsMessage);
    this.send(wsResponse);
  }

  private async validateHandler(wsMessage: WsRequest) {
    const wsResponse = WsSuccessResponse.fromRequest(wsMessage);
    this.send(wsResponse);
  }

  private async messageHandler(wsMessage: WsRequest) {
    const wsResponse = WsSuccessResponse.fromRequest(wsMessage);
    this.send(wsResponse);
  }
}
