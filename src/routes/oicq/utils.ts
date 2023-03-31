import Ajv, { JTDSchemaType, ValidateFunction } from "ajv/dist/jtd";
import { cpu, mem, os } from "node-os-utils";

import { WsAction, WsRequest, WsFailureResponse } from "./types";

const ajv = new Ajv();

const WsMessageSchema: JTDSchemaType<WsRequest> = {
  properties: {
    action: { type: "uint32" },
  },
  optionalProperties: { data: {} },
};

const WsMessageParser = ajv.compileParser(WsMessageSchema);

const dataValidators: ValidateFunction[] = [];

dataValidators[WsAction.Monitor] = ajv.compile({} as JTDSchemaType<null>);

dataValidators[WsAction.Subscribe] = ajv.compile({
  properties: {
    account: { type: "uint32" },
  },
} as JTDSchemaType<{
  account: number;
}>);

dataValidators[WsAction.Login] = ajv.compile({
  optionalProperties: {
    payload: { type: "string" },
  },
} as JTDSchemaType<{
  payload: string | undefined;
}>);

dataValidators[WsAction.Validate] = ajv.compile({
  properties: {
    type: { enum: ["qrcode", "sms", "slider"] },
  },
  optionalProperties: {
    payload: { type: "string" },
  },
} as JTDSchemaType<{
  type: "qrcode" | "sms" | "slider";
  payload: string | undefined;
}>);

dataValidators[WsAction.Message] = ajv.compile({
  properties: {
    sender: { type: "uint32" },
    message: { type: "string" },
  },
} as JTDSchemaType<{
  sender: number;
  message: string;
}>);

function parseWsMessage(raw: string): WsRequest {
  const message: WsRequest | undefined = WsMessageParser(raw);
  if (message === undefined) {
    throw new WsFailureResponse(WsAction.Invalid, WsMessageParser.message, [
      `Error at: ${WsMessageParser.position}`,
    ]);
  }
  const validator: ValidateFunction = dataValidators[message.action];
  if (validator === undefined) {
    throw WsFailureResponse.fromRequest(message, "Invalid action number");
  }
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
