import fp from "fastify-plugin";
import { parse, WsMessage } from "./oicq";

export default fp(async (fastify, opts) => {
  fastify.decorate("parse", (raw: string): WsMessage | undefined => {
    return parse(raw);
  });
});

declare module "fastify" {
  export interface FastifyInstance {
    parse(raw: string): WsMessage | undefined;
  }
}
