import {FastifyPluginAsync} from "fastify";
import {generateVAPIDKeys, sendNotification, setVapidDetails} from 'web-push';

const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    console.warn("Invalid VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY, you can use this generate one:");
    console.log(generateVAPIDKeys());
    process.exit(1);
}


setVapidDetails('mailto:particle_g@outlook.com', vapidKeys.publicKey, vapidKeys.privateKey);

const service: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/key', async (request, reply) => {
        return {data: vapidKeys.publicKey};
    });
    fastify.post('/subscribe', async (request, reply) => {
        const body: any = request.body;
        console.log(body);
        const result = await sendNotification(
            body.subscription,
            JSON.stringify({
                title: "Subscription Result",
                body: "Subscribe successfully!",
            })
        );
        console.log(result);
        return result;
    });
}

export default service;