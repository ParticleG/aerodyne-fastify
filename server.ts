import { ErrorObject } from "ajv/lib/types";
import chalk from "chalk";
import closeWithGrace from "close-with-grace";
import Fastify from "fastify";
import * as webPush from "web-push";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";

const fastify = Fastify({
  logger: false,
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
  fastify.register(import("./src/app"), fastify.config);
  const closeListeners = closeWithGrace(
    { delay: fastify.config.server.close_delay },
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
      host: fastify.config.server.host,
      port: fastify.config.server.port,
    },
    (err: any) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
    }
  );
}

main().catch((errors) => {
  if (errors instanceof Array<ErrorObject>) {
    errors = errors.map((error: ErrorObject, index) => {
      if (
        error.instancePath === "/vapid/private_key" ||
        error.instancePath === "/vapid/public_key"
      ) {
        return (
          chalk.red("[Config]") +
          `Config error: ` +
          chalk.yellow(`"${error.message}"`) +
          ` at ` +
          chalk.blue.underline(error.instancePath) +
          `, you can use this generate one: ` +
          chalk.green(JSON.stringify(webPush.generateVAPIDKeys(), undefined, 2))
        );
      }
      return `Config error[${index}]: "${error.message}" at ${error.instancePath}`;
    });
  }
  console.log(errors.join("\n"));
  fastify.close().then(
    () => console.log(chalk.green("Server successfully closed")),
    (err) => console.log(chalk.red("Server cannot close dur to an error: ", err))
  );
});
