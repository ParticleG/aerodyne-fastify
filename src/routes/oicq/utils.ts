import Ajv, { JTDSchemaType, ValidateFunction } from "ajv/dist/jtd";
import { ErrorMessage, WsAction, WsMessage } from "./types";

const ajv = new Ajv();

const WsMessageSchema: JTDSchemaType<WsMessage> = {
  properties: {
    action: { type: "uint32" },
  },
  optionalProperties: { data: {} },
};

const WsMessageParser = ajv.compileParser(WsMessageSchema);

const dataValidators: ValidateFunction[] = [];

dataValidators[WsAction.Login] = ajv.compile({
  properties: {
    account: { type: "uint32" },
  },
  optionalProperties: {
    password: { type: "string" },
  },
} as JTDSchemaType<{
  account: number;
  password: string | undefined;
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

function parse(raw: string): WsMessage {
  const message: WsMessage | undefined = WsMessageParser(raw);
  if (message === undefined) {
    throw new ErrorMessage(WsMessageParser.message, undefined, [
      `Error at: ${WsMessageParser.position}`,
    ]);
  }
  const validator: ValidateFunction = dataValidators[message.action];
  if (validator === undefined) {
    throw new ErrorMessage("Invalid action number", message.action);
  }
  if (!validator(message.data)) {
    throw new ErrorMessage(
      "Invalid message data",
      message.action,
      validator.errors?.map(
        (e) =>
          `${e.instancePath} ${e.message ? e.message : "has unknown error"}`
      )
    );
  }
  return message;
}

export { parse, WsMessage };
