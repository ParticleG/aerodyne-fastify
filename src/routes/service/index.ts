import { FastifyPluginAsync } from "fastify";
import * as webPush from "web-push";
import { subscribeSchema } from "./schema";

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.warn(
    "Invalid VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY, you can use this generate one:"
  );
  console.log(webPush.generateVAPIDKeys());
  process.exit(1);
}

webPush.setVapidDetails(
  "mailto:particle_g@outlook.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const service: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/key", async (request, reply) => {
    return { data: vapidKeys.publicKey };
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
