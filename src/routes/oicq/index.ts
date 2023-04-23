import { FastifyPluginAsync } from "fastify";
import WsConnection from "./WsConnection";

const oicq: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", { websocket: true }, async (connection, req) => {
    new WsConnection(0, connection.socket);
  });
};

export default oicq;
