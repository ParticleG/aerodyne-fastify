import { FastifyPluginAsync } from 'fastify';

import { WsConnection } from 'src/types/WsConnection';
import { Logger, LogLevel } from 'src/types/Logger';

export default <FastifyPluginAsync>(async (fastify): Promise<void> => {
  fastify.get('/', { websocket: true }, async (connection, request) => {
    Logger.info('OICQ', `New connection from ${LogLevel.info(request.ip)}`);
    new WsConnection(0, connection.socket);
  });
});
