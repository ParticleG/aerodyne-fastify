import { FastifyPluginAsync } from "fastify";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { join } from "path";

export type AppOptions = {
  test: string;
} & Partial<AutoloadPluginOptions>;

const options: AppOptions = {
  test: "test",
};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  await fastify.register(websocket, {
    errorHandler: function (
      error,
      conn /* SocketStream */,
      req /* FastifyRequest */,
      reply /* FastifyReply */
    ) {
      console.log("errorHandler");
      console.log(error);
    },
  });
  await fastify.register(cors, {});

  console.log("options", options);
  console.log("opts", opts);

  // Do not touch the following lines
  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  await fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });
  // This loads all plugins defined in routes
  // define your routes in one of these
  await fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    options: opts,
  });
};

export default app;
export { app, options };
