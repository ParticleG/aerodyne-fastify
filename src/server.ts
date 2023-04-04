import * as closeWithGrace from "close-with-grace";
import Fastify from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    config: {
      NODE_ENV: string;
    };
  }
}

// Instantiate Fastify with some config
const fastify = Fastify({
  logger: true,
});

fastify.register(import("./app")).ready(() => {
  console.log(fastify.config);
  const closeListeners = closeWithGrace(
    { delay: parseInt(process.env.FASTIFY_CLOSE_GRACE_DELAY ?? "500") },
    async function ({ signal, err, manual }) {
      if (err) {
        fastify.log.error(err);
      }
      await fastify.close();
    } satisfies closeWithGrace.CloseWithGraceAsyncCallback
  );

  fastify.addHook("onClose", async (instance, done) => {
    closeListeners.uninstall();
    done();
  });

  // Start listening.
  fastify.listen(
    {
      host: process.env.FASTIFY_LISTENING_HOST ?? "localhost",
      port: parseInt(process.env.FASTIFY_LISTENING_PORT ?? "3000"),
    },
    (err: any) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
    }
  );
});
