import { FastifyPluginAsync } from 'fastify';

import {
  sliderGetSchema,
  sliderPostSchema,
  sliderPostType,
} from 'src/routes/oicq/schema';
import { sliderHtml } from 'src/statics/sliderHtml';
import { WsConnection } from 'src/types/WsConnection';
import { Logger, LogLevel } from 'src/types/Logger';
import { ClientManager } from 'src/types/ClientManager';

export default <FastifyPluginAsync>(async (fastify): Promise<void> => {
  fastify.get('/', { websocket: true }, async (connection, request) => {
    Logger.info('OICQ', `New connection from ${LogLevel.info(request.ip)}`);
    new WsConnection(0, connection.socket);
  });
  fastify.get(
    '/slider',
    { schema: sliderGetSchema },
    async function (req, reply) {
      return reply.type('myHtml.html').send(sliderHtml);
    }
  );
  fastify.post<sliderPostType>(
    '/slider',
    { schema: sliderPostSchema },
    async function (req) {
      const { account, ticket } = req.body;
      return {
        result: ClientManager.loginClient(account, ticket)
          ? 'success'
          : 'failure',
      };
    }
  );
});
