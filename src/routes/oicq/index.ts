import { FastifyPluginAsync } from "fastify";
import WsConnection from "./WsConnection";
import { WsAction, WsSuccessResponse } from "./types";
import { getSystemInfo } from "./utils";

const oicq: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", { websocket: true }, async (connection, req) => {
    const wsConnection = new WsConnection(0, connection.socket);
    const wsResponse = new WsSuccessResponse(
      WsAction.Monitor,
      await getSystemInfo()
    );
    wsConnection.send(wsResponse);
  });
};

export default oicq;
