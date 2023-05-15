import { FastifyPluginAsync } from 'fastify';

import {
  sliderGetSchema,
  sliderPostSchema,
  sliderPostType,
} from 'routes/oicq/schema';
import { sliderHtml } from 'statics/sliderHtml';
import { ClientManager } from 'types/ClientManager';
import { WsConnection } from 'types/WsConnection';
import { Logger, LogLevel } from 'types/Logger';

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
