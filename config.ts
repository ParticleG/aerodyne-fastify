import Ajv from 'ajv';
import { readFileSync } from 'fs';
import fastifyPlugin from 'fastify-plugin';
import { join, resolve } from 'path';
import { parse } from 'toml';

const ajv = new Ajv();

type ConfigType = {
  mode: 'single' | 'multiple';
  server: {
    close_delay: number;
    host: string;
    port: number;
  };
  vapid: {
    email: string;
    private_key: string;
    public_key: string;
  };
};

const validate = ajv.compile({
  type: 'object',
  required: ['mode', 'server', 'vapid'],
  properties: {
    mode: {
      enum: ['single', 'multiple'],
    },
    server: {
      type: 'object',
      properties: {
        close_delay: {
          type: 'number',
          default: 500,
          minimum: 0,
        },
        host: {
          type: 'string',
          default: 'localhost',
        },
        port: {
          type: 'number',
          default: 3000,
          minimum: 0,
          maximum: 65535,
        },
      },
    },
    vapid: {
      type: 'object',
      required: ['private_key', 'public_key'],
      properties: {
        email: {
          type: 'string',
        },
        private_key: {
          type: 'string',
          minLength: 43,
        },
        public_key: {
          type: 'string',
          minLength: 87,
        },
      },
    },
  },
});

export default fastifyPlugin(async (fastify) => {
  const config = parse(
    readFileSync(resolve(join(process.cwd(), 'config.toml'))).toString()
  );

  if (validate(config)) {
    fastify.config = config as ConfigType;
  } else {
    throw validate.errors;
  }
});

declare module 'fastify' {
  // noinspection JSUnusedGlobalSymbols
  interface FastifyInstance {
    config: ConfigType;
  }
}
