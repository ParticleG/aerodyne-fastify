import { FastifyPluginAsync } from 'fastify';
import * as webPush from 'web-push';
import { subscribeSchema } from './schema';

export default <FastifyPluginAsync>(async (fastify): Promise<void> => {
  webPush.setVapidDetails(
    `mailto:${fastify.config.vapid.email}`,
    fastify.config.vapid.public_key,
    fastify.config.vapid.private_key
  );
  fastify.get('/key', async () => {
    return { data: fastify.config.vapid.public_key };
  });
  fastify.post('/subscribe', { schema: subscribeSchema }, async (request) => {
    const body: any = request.body;
    console.log(body.subscription);
    await webPush.sendNotification(
      body.subscription,
      JSON.stringify({
        title: 'Subscription Result',
        body: 'Subscribe successfully!',
      })
    );
    return {};
  });
});
