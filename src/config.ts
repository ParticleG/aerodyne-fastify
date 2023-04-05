import { parse } from "toml";
import fastifyPlugin from "fastify-plugin";
import fastifyEnv, { FastifyEnvOptions } from "@fastify/env";
import { join, resolve } from "path";
import { JTDSchemaType } from "ajv/dist/jtd";

type ConfigType = {
  FASTIFY_CLOSE_GRACE_DELAY: number;
  FASTIFY_LISTENING_HOST: string;
  FASTIFY_LISTENING_PORT: number;
  FASTIFY_LOG_LEVEL: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_PUBLIC_KEY: string;
}

const configSchema : JTDSchemaType<ConfigType> = {

}

const config = parse(
  resolve(join(require?.main?.path || process.cwd(), "config.toml"))
);

const options = {
  confKey: "config",
  dotenv: true,
  schema: {
    type: "object",
    required: ["FASTIFY_LOG_LEVEL", "VAPID_PRIVATE_KEY", "VAPID_PUBLIC_KEY"],
    properties: {
      FASTIFY_CLOSE_GRACE_DELAY: {
        type: "number",
        default: 500,
        minimum: 0,
      },
      FASTIFY_LISTENING_HOST: {
        type: "string",
        default: "localhost",
      },
      FASTIFY_LISTENING_PORT: {
        type: "number",
        default: 3000,
        minimum: 0,
        maximum: 65535,
      },
      FASTIFY_LOG_LEVEL: {
        enum: ["verbose", "debug", "info", "warn", "error", "fatal", "silent"],
      },
      VAPID_PRIVATE_KEY: {
        type: "string",
        minLength: 87,
      },
      VAPID_PUBLIC_KEY: {
        type: "string",
        minLength: 43,
      },
    },
  },
};

export default fastifyPlugin<FastifyEnvOptions>(async (fastify) => {
  await fastify.register(fastifyEnv, options);
  console.log(fastify.config);
});

declare module "fastify" {
  interface FastifyInstance {
    config: ConfigType;
  }
}
