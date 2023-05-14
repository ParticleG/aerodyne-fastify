import { v4 as uuid } from "uuid";
import { RawData, WebSocket } from "ws";

import { OicqClient } from "./OicqClient";
import { ClientManager } from "./ClientManager";
import { OicqAccount, UserId, WsId } from "./common";
import { WsRequest } from "./WsRequest";
import { WsAction } from "./WsAction";
import { WsResponse } from "./WsResponse";
import { parseWsMessage } from "../utils/validator";
import { WsSuccessResponse } from "./WsSuccessResponse";
import { WsFailureResponse } from "./WsFailureResponse";
import { getSystemInfo } from "src/utils/common";
import { Logger, LogLevel } from "src/types/Logger";

type MessageHandler = (wsMessage: WsRequest) => Promise<void>;
type ClientMap = Map<OicqAccount, OicqClient | undefined>;
type HandlerMap = Map<WsAction, MessageHandler>;

export class WsConnection {
  readonly wsId: WsId = uuid();
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
      Logger.info(
        "OICQ",
        `Connection closed for userId: ${LogLevel.info(userId)}`
      );
    });

    this.handlerMap.set(WsAction.Monitor, this.monitorHandler);
    this.handlerMap.set(WsAction.List, this.listHandler);
    this.handlerMap.set(WsAction.Subscribe, this.subscribeHandler);
    this.handlerMap.set(WsAction.Login, this.loginHandler);
    this.handlerMap.set(WsAction.Message, this.messageHandler);
    this.handlerMap.set(WsAction.ClientInfo, this.clientInfoHandler);
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
      WsSuccessResponse.fromRequest(wsMessage, undefined, await getSystemInfo())
    );
  }

  private async listHandler(wsMessage: WsRequest) {
    this.respond(
      WsSuccessResponse.fromRequest(wsMessage, undefined, ClientManager.listClients())
    );
  }

  private async subscribeHandler(wsMessage: WsRequest) {
    const { account } = wsMessage.data;
    const result = ClientManager.connectClient(this, account);
    if (result) {
      this.respond(WsSuccessResponse.fromRequest(wsMessage, account, result));
    } else {
      this.respond(
        WsFailureResponse.fromRequest(wsMessage, account, "Validate failed", [
          "Please check the account"
        ])
      );
    }
  }

  private async loginHandler(wsMessage: WsRequest) {
    const { account, payload } = wsMessage.data;
    const client = this.clientMap.get(account);
    if (client === undefined) {
      this.respond(
        WsFailureResponse.fromRequest(wsMessage, account, "Client not found", [
          "Subscribe to the account first"
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

  private async clientInfoHandler(wsMessage: WsRequest) {
    const { account } = wsMessage.data;
    const client = this.clientMap.get(account);
    if (client === undefined) {
      this.respond(
        WsFailureResponse.fromRequest(wsMessage, account, "Client not found", [
          "Subscribe to the account first"
        ])
      );
      return;
    }
    try {
      this.respond(WsSuccessResponse.fromRequest(wsMessage, account, client.getInfo()));
    } catch (error) {
      console.log(error);
      this.respond(error as WsFailureResponse);
    }
  }
}
