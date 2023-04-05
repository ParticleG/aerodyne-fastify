import Ajv, { JTDSchemaType } from "ajv/dist/jtd";
import { cpu, mem, os } from "node-os-utils";

import {
  ValidatorMap,
  ValidatorMapType,
  WsAction,
  WsFailureResponse,
  WsRequest,
} from "./types";

const ajv = new Ajv();

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
      account: { type: "uint32" },
    },
  } as JTDSchemaType<{
    account: number;
  }>)
);
dataValidators.set(
  WsAction.Login,
  ajv.compile({
    properties: {
      account: { type: "uint32" },
    },
    optionalProperties: {
      payload: { type: "string" },
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
      sender: { type: "uint32" },
      message: { type: "string" },
    },
  } as JTDSchemaType<{
    sender: number;
    message: string;
  }>)
);

console.log("Initializing data validators...");

Object.values(WsAction).forEach((action) => {
  if (!dataValidators.has(action)) {
    throw new Error(`Missing data validator for action: ${action}`);
  }
});

function parseWsMessage(raw: string): WsRequest {
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
      "Invalid message data",
      validator.errors?.map(
        (e) =>
          `${e.instancePath} ${e.message ? e.message : "has unknown error"}`
      )
    );
  }
  return message;
}

async function getSystemInfo() {
  return {
    cpu: {
      cores: cpu.count(),
      model: cpu.model(),
      usage: await cpu.usage(),
    },
    memory: await mem.info(),
    os: {
      arch: os.arch(),
      hostname: os.hostname(),
      name: await os.oos(),
      platform: os.platform(),
    },
  };
}

export { parseWsMessage, getSystemInfo };
