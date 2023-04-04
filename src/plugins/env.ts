import { JSONSchemaType } from "ajv";
import { EnvSchemaData } from "env-schema";
import { FastifyInstance } from "fastify";
import fastifyEnv, { FastifyEnvOptions } from "@fastify/env";
import fastifyPlugin from "fastify-plugin";

const schema: Omit<JSONSchemaType<EnvSchemaData>, "required"> = {
  type: "object",
  required: ["LOG_LEVEL", "NODE_ENV", "VAPID_PRIVATE_KEY", "VAPID_PUBLIC_KEY"],
  properties: {
    LOG_LEVEL: {
      enum: ["verbose", "debug", "info", "warn", "error", "fatal", "silent"],
    },
    NODE_ENV: {
      enum: ["development", "production", "test"],
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
};

const options: FastifyEnvOptions = {
  dotenv: true,
  schema,
};

export default fastifyPlugin<FastifyEnvOptions>((server: FastifyInstance) => {
  return new Promise((resolve, reject) => {
    server.register(fastifyEnv, options).ready((err) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
});
