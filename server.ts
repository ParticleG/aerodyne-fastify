import { ErrorObject } from "ajv/lib/types";
import * as chalk from "chalk";
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import * as webPush from "web-push";

import { Logger } from "./src/utils";

const fastify = Fastify({
  logger: {
    level: "warn"
  }
});

async function main() {
  await fastify.register(import("./config"));
  await fastify.register(cors, {});
  await fastify.register(websocket, {
    errorHandler: function(error, conn, req, reply) {
      console.log(error);
      console.log(conn);
      console.log(req);
      console.log(reply);
    }
  });
  fastify.register(import("./src/app"), fastify.config);

  fastify.listen(
    {
      host: fastify.config.server.host,
      port: fastify.config.server.port
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
    errors.forEach((error: ErrorObject) => {
      const module = "Config";
      const reason =
        chalk.yellow(`${error.message}`) +
        (error.instancePath
          ? " at " + chalk.blue.underline(error.instancePath)
          : "");
      if (
        error.instancePath === "/vapid/private_key" ||
        error.instancePath === "/vapid/public_key"
      ) {
        Logger.error(
          module,
          "Invalid config item",
          reason,
          "Use these generated keys in config file: " +
          chalk.green(
            JSON.stringify(webPush.generateVAPIDKeys(), undefined, 2)
          )
        );
      }
      Logger.error(module, "Invalid config item", reason);
    });
  } else {
    console.log(errors.join("\n"));
  }
  fastify.close().then(
    () => Logger.success("Server", "Successfully closed"),
    (err) => Logger.error("Server", "Cannot close", err.message)
  );
});
