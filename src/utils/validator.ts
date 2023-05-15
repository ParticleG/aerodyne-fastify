import Ajv, { JTDSchemaType, ValidateFunction } from 'ajv/dist/jtd';

import { Logger } from 'types/Logger';
import { WsAction } from 'types/common';
import {
  ClientInfoRequest,
  ListRequest,
  LoginRequest,
  LogoutRequest,
  MessageRequest,
  MonitorRequest,
  SubscribeRequest,
  WsFailureResponse,
  WsRequest,
} from 'types/websocket';

Logger.info('Utility', 'Initializing message validators...');

const ajv = new Ajv();

const sharedProperties = (
  hasAccount = false,
  additionalProperties?: any,
  optionalProperties?: any
) => {
  const result: { [key: string]: any } = {
    properties: {
      ...additionalProperties,
      action: {
        enum: Object.values(WsAction),
      },
    },
    additionalProperties: false,
  };
  if (hasAccount) {
    result.properties.account = { type: 'float64' };
  }
  if (optionalProperties) {
    result.optionalProperties = optionalProperties;
  }
  return result;
};

const WsMessageParser = ajv.compileParser(
  sharedProperties(false, null, {
    account: { type: 'float64' },
    data: { nullable: true },
  }) as JTDSchemaType<WsRequest>
);

const wsMessageValidators = new Map<WsAction, ValidateFunction>();

wsMessageValidators.set(
  WsAction.Invalid,
  ajv.compile({
    properties: {
      action: {
        enum: Object.values(WsAction),
      },
    },
    additionalProperties: true,
  } as JTDSchemaType<any>)
);
wsMessageValidators.set(
  WsAction.Monitor,
  ajv.compile(sharedProperties() as JTDSchemaType<MonitorRequest>)
);
wsMessageValidators.set(
  WsAction.List,
  ajv.compile(sharedProperties() as JTDSchemaType<ListRequest>)
);
wsMessageValidators.set(
  WsAction.Subscribe,
  ajv.compile(sharedProperties(true) as JTDSchemaType<SubscribeRequest>)
);
wsMessageValidators.set(
  WsAction.Login,
  ajv.compile(
    sharedProperties(true, null, {
      data: { type: 'string' },
    }) as JTDSchemaType<LoginRequest>
  )
);
wsMessageValidators.set(
  WsAction.Logout,
  ajv.compile(sharedProperties(true) as JTDSchemaType<LogoutRequest>)
);
wsMessageValidators.set(
  WsAction.Message,
  ajv.compile(
    sharedProperties(true, {
      message: { type: 'string' },
    }) as JTDSchemaType<MessageRequest>
  )
);
wsMessageValidators.set(
  WsAction.ClientInfo,
  ajv.compile(sharedProperties(true) as JTDSchemaType<ClientInfoRequest>)
);

Object.values(WsAction).forEach((action) => {
  if (!wsMessageValidators.has(action)) {
    throw new Error(`Missing data validator for action: ${action}`);
  }
});

Logger.info('Utility', 'Message validators loaded');

export function parseWsMessage(raw: string): WsRequest {
  const message: WsRequest | undefined = WsMessageParser(raw);
  if (message === undefined) {
    throw new WsFailureResponse(
      WsAction.Invalid,
      undefined,
      WsMessageParser.message,
      [`Error at: ${WsMessageParser.position}`]
    );
  }
  const account = message.account;
  const validator = wsMessageValidators.get(message.action)!;
  if (!validator(message)) {
    throw WsFailureResponse.fromRequest(
      message,
      account,
      'Invalid message data',
      validator.errors?.map(
        (e) =>
          `${e.instancePath} ${e.message ? e.message : 'has unknown error'}`
      )
    );
  }
  return message;
}
