import { FastifyPluginAsync } from "fastify";
import WsConnection from "./WsConnection";
import { WsAction } from "./types";
import { getSystemInfo } from "./utils";

const oicq: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", { websocket: true }, async (connection, req) => {
    const wsConnection = new WsConnection(0, connection.socket);
    wsConnection.send(
      JSON.stringify({
        action: WsAction.Monitor,
        data: await getSystemInfo(),
      })
    );
  });
};

export default oicq;
