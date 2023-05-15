import { ErrorObject } from 'ajv/lib/types';
import Fastify from 'fastify';
import * as webPush from 'web-push';

import { ClientManager } from "types/ClientManager";
import { Logger, LogLevel } from 'types/Logger';

const fastify = Fastify({
  logger: {
    level: 'warn',
  },
});

async function main() {
  Logger.info('Config', `Loading server configs...`);

  await fastify.register(import('fastify-graceful-shutdown'));
  fastify.gracefulShutdown((signal, next) => {
    console.log(signal);
    ClientManager.shutdown();
    next();
  });
  await fastify.register(import('@fastify/cors'));
  await fastify.register(import('@fastify/websocket'));
  await fastify.register(import('app/config'));

  fastify.register(import('app/src/app'), fastify.config);
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

  // noinspection HttpUrlsUsage
  Logger.info(
    'Config',
    `Server is running in ${LogLevel.info(
      fastify.config.mode
    )} mode, listening on ` +
      LogLevel.info(
        `http://${fastify.config.server.host}:${fastify.config.server.port}`
      )
  );
}

main().catch((errors) => {
  if (errors instanceof Array<ErrorObject>) {
    errors.forEach((error: ErrorObject) => {
      const module = 'Config';
      const reason =
        LogLevel.warning(`${error.message}`) +
        (error.instancePath ? ' at ' + LogLevel.link(error.instancePath) : '');
      if (
        error.instancePath === '/vapid/private_key' ||
        error.instancePath === '/vapid/public_key'
      ) {
        Logger.error(
          module,
          'Invalid config item',
          reason,
          'Use these generated keys in config file: ' +
            LogLevel.info(
              JSON.stringify(webPush.generateVAPIDKeys(), undefined, 2)
            )
        );
      }
      Logger.error(module, 'Invalid config item', reason);
    });
  } else {
    console.log(errors.join('\n'));
  }
  fastify.close().then(
    () => Logger.success('Server', 'Successfully closed'),
    (err) => Logger.error('Server', 'Cannot close', err.message)
  );
});
