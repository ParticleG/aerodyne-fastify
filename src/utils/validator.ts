import Ajv, { JTDSchemaType, ValidateFunction } from 'ajv/dist/jtd';
import { Logger } from '../types/Logger';
import { WsAction } from '../types/WsAction';
import { WsRequest } from '../types/WsRequest';
import { WsFailureResponse } from '../types/WsFailureResponse';

class ValidatorMap extends Map<WsAction, ValidateFunction> {}

type ValidatorMapType = Map<WsAction, ValidateFunction>;

const ajv = new Ajv();

Logger.info('Utility', 'Initializing data validators...');

const WsMessageParser = ajv.compileParser({
  properties: {
    action: {
      enum: Object.values(WsAction),
    },
  },
  optionalProperties: { data: {} },
} as JTDSchemaType<WsRequest>);

const dataValidators: ValidatorMapType = new ValidatorMap();

dataValidators.set(WsAction.Invalid, ajv.compile({} as JTDSchemaType<null>));
dataValidators.set(WsAction.Monitor, ajv.compile({} as JTDSchemaType<null>));
dataValidators.set(WsAction.List, ajv.compile({} as JTDSchemaType<null>));
dataValidators.set(
  WsAction.Subscribe,
  ajv.compile({
    properties: {
      account: { type: 'uint32' },
    },
    optionalProperties: {
      password: { type: 'string' },
    },
  } as JTDSchemaType<{
    account: number;
    password?: string;
  }>)
);
dataValidators.set(
  WsAction.Login,
  ajv.compile({
    properties: {
      account: { type: 'uint32' },
    },
    optionalProperties: {
      payload: { type: 'string' },
    },
  } as JTDSchemaType<{
    account: number;
    payload: string | undefined;
  }>)
);
dataValidators.set(WsAction.Logout, ajv.compile({} as JTDSchemaType<null>));
dataValidators.set(
  WsAction.Message,
  ajv.compile({
    properties: {
      sender: { type: 'uint32' },
      message: { type: 'string' },
    },
  } as JTDSchemaType<{
    sender: number;
    message: string;
  }>)
);

Object.values(WsAction).forEach((action) => {
  if (!dataValidators.has(action)) {
    throw new Error(`Missing data validator for action: ${action}`);
  }
});

export function parseWsMessage(raw: string): WsRequest {
  const message: WsRequest | undefined = WsMessageParser(raw);
  if (message === undefined) {
    throw new WsFailureResponse(WsAction.Invalid, WsMessageParser.message, [
      `Error at: ${WsMessageParser.position}`,
    ]);
  }
  const validator = dataValidators.get(message.action)!;
  if (!validator(message.data)) {
    throw WsFailureResponse.fromRequest(
      message,
      'Invalid message data',
      validator.errors?.map(
        (e) =>
          `${e.instancePath} ${e.message ? e.message : 'has unknown error'}`
      )
    );
  }
  return message;
}
