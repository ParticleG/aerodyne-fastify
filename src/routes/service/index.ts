import { FastifyPluginAsync } from "fastify";
import * as webPush from "web-push";
import { subscribeSchema } from "./schema";

const service: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  webPush.setVapidDetails(
    "mailto:particle_g@outlook.com",
    fastify.config.vapid.public_key,
    fastify.config.vapid.private_key
  );
  fastify.get("/key", async (request, reply) => {
    return { data: fastify.config.vapid.public_key };
  });
  fastify.post(
    "/subscribe",
    { schema: subscribeSchema },
    async (request, reply) => {
      const body: any = request.body;
      console.log(body.subscription);
      await webPush.sendNotification(
        body.subscription,
        JSON.stringify({
          title: "Subscription Result",
          body: "Subscribe successfully!",
        })
      );
      return {};
    }
  );
};

export default service;
