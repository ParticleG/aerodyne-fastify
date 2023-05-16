import { v4 as uuid } from 'uuid';
import { RawData, WebSocket } from 'ws';

import { ClientManager } from 'types/ClientManager';
import { Logger, LogLevel } from 'types/Logger';
import { OicqClient } from 'types/OicqClient';
import { OicqAccount, UserId, WsAction, WsId } from 'types/common';
import {
  ClientInfoRequest, HistoryRequest,
  ListRequest,
  LoginRequest,
  MessageRequest,
  MonitorRequest,
  SubscribeRequest,
  WsFailureResponse,
  WsResponse,
  WsSuccessResponse
} from "types/websocket";
import { getSystemInfo } from 'utils/common';
import { parseWsMessage } from 'utils/validator';
import * as console from 'console';

type MessageHandler = (wsMessage: any) => Promise<void>;

export class WsConnection {
  readonly wsId: WsId = uuid();
  userId: UserId;
  private socket: WebSocket;
  private clientMap = new Map<OicqAccount, OicqClient | undefined>();
  private readonly handlerMap = new Map<WsAction, MessageHandler>();

  constructor(userId: UserId, ws: WebSocket) {
    this.userId = userId;
    this.socket = ws;

    this.socket.on('message', async (message) => {
      await this.handleMessage(message);
    });
    this.socket.on('close', () => {
      this.clientMap.forEach((client) => {
        client?.unsubscribe(this.wsId);
      });
      Logger.info(
        'OICQ',
        `Connection closed for userId: ${LogLevel.info(userId)}`
      );
    });

    this.handlerMap.set(WsAction.Monitor, this.monitorHandler);
    this.handlerMap.set(WsAction.List, this.listHandler);
    this.handlerMap.set(WsAction.Subscribe, this.subscribeHandler);
    this.handlerMap.set(WsAction.Login, this.loginHandler);
    this.handlerMap.set(WsAction.Message, this.messageHandler);
    this.handlerMap.set(WsAction.ClientInfo, this.clientInfoHandler);
    this.handlerMap.set(WsAction.History, this.historyHandler);
  }

  subscribe(client: OicqClient) {
    this.clientMap.set(client.account, client);
    console.log(
      "[Subscribe]Connection's client map size: ",
      this.clientMap.size
    );
  }

  respond(wsResponse: WsResponse) {
    if (wsResponse.result === 'error') {
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

  private async monitorHandler(wsMessage: MonitorRequest) {
    this.respond(
      WsSuccessResponse.fromRequest(wsMessage, undefined, await getSystemInfo())
    );
  }

  private async listHandler(wsMessage: ListRequest) {
    this.respond(
      WsSuccessResponse.fromRequest(
        wsMessage,
        undefined,
        ClientManager.listClients()
      )
    );
  }

  private async subscribeHandler(wsMessage: SubscribeRequest) {
    const result = ClientManager.connectClient(this, wsMessage.account);
    if (result) {
      this.respond(
        WsSuccessResponse.fromRequest(wsMessage, wsMessage.account, result)
      );
    } else {
      this.respond(
        WsFailureResponse.fromRequest(
          wsMessage,
          wsMessage.account,
          'Validate failed',
          ['Please check the account']
        )
      );
    }
  }

  private async loginHandler(wsMessage: LoginRequest) {
    const client = this.clientMap.get(wsMessage.account);
    if (client === undefined) {
      this.respond(
        WsFailureResponse.fromRequest(
          wsMessage,
          wsMessage.account,
          'Client not found',
          ['Subscribe to the account first']
        )
      );
      return;
    }
    try {
      client.login(wsMessage.data);
    } catch (error) {
      this.respond(error as WsFailureResponse);
    }
  }

  private async messageHandler(wsMessage: MessageRequest) {
    const wsResponse = WsSuccessResponse.fromRequest(wsMessage);
    this.respond(wsResponse);
  }

  private async clientInfoHandler(wsMessage: ClientInfoRequest) {
    const client = this.clientMap.get(wsMessage.account);
    if (client === undefined) {
      this.respond(
        WsFailureResponse.fromRequest(
          wsMessage,
          wsMessage.account,
          'Client not found',
          ['Subscribe to the account first']
        )
      );
      return;
    }
    try {
      this.respond(
        WsSuccessResponse.fromRequest(
          wsMessage,
          wsMessage.account,
          await client.getInfo()
        )
      );
    } catch (error) {
      console.log(error);
      this.respond(error as WsFailureResponse);
    }
  }

  private async historyHandler(wsMessage: HistoryRequest) {
    const client = this.clientMap.get(wsMessage.account);
    if (client === undefined) {
      this.respond(
        WsFailureResponse.fromRequest(
          wsMessage,
          wsMessage.account,
          'Client not found',
          ['Subscribe to the account first']
        )
      );
      return;
    }
    try {
      this.respond(
        WsSuccessResponse.fromRequest(
          wsMessage,
          wsMessage.account,
          await client.getHistory(wsMessage)
        )
      );
    } catch (error) {
      console.log(error);
      this.respond(error as WsFailureResponse);
    }
  }
}
