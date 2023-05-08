import { FastifyPluginAsync } from "fastify";

import { WsConnection } from "src/types/WsConnection";
import { Logger } from "src/types/Logger";
import * as chalk from "chalk";

export default <FastifyPluginAsync>(async (fastify): Promise<void> => {
  fastify.get("/", { websocket: true }, async (connection, request) => {
    Logger.info("OICQ", `New connection from ${chalk.blue(request.ip)}`);
    new WsConnection(0, connection.socket);
  });
});
