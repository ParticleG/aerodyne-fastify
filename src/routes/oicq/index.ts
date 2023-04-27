import { FastifyPluginAsync } from 'fastify';

import { WsConnection } from 'src/types/WsConnection';

export default <FastifyPluginAsync>(async (fastify): Promise<void> => {
  fastify.get('/', { websocket: true }, async (connection) => {
    new WsConnection(0, connection.socket);
  });
});
