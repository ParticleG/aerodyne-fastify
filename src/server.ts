import { ErrorObject } from "ajv/lib/types";
import closeWithGrace from "close-with-grace";
import Fastify from "fastify";
import * as webPush from "web-push";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";

const fastify = Fastify({
  logger: true,
});

async function main() {
  await fastify.register(import("./config"));
  await fastify.register(cors, {});
  await fastify.register(websocket, {
    errorHandler: function (error, conn, req, reply) {
      console.log(error);
      console.log(conn);
      console.log(req);
      console.log(reply);
    },
  });
  fastify.register(import("./app"), fastify.config);
  const closeListeners = closeWithGrace(
    { delay: fastify.config.FASTIFY_CLOSE_GRACE_DELAY },
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
      host: fastify.config.FASTIFY_LISTENING_HOST,
      port: fastify.config.FASTIFY_LISTENING_PORT,
    },
    (err: any) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
    }
  );
}

main().catch(({ errors }) => {
  let noVapidKeys = false;
  console.log(errors);
  errors.map((error: ErrorObject) => {
    if (
      error.instancePath === "/VAPID_PRIVATE_KEY" ||
      error.instancePath === "/VAPID_PUBLIC_KEY"
    ) {
      noVapidKeys = true;
    }
    return ".env config error: " + error.message + " at " + error.instancePath;
  });
  if (noVapidKeys) {
    console.warn(
      "Invalid VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY, you can use this generate one:",
      webPush.generateVAPIDKeys()
    );
  }
  fastify.close().then(
    () => console.log("Server successfully closed"),
    (err) => console.log("Server cannot close dur to an error: ", err)
  );
});
