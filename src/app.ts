import cors from '@fastify/cors';
import {join} from 'path';
import {FastifyPluginAsync} from 'fastify';
import AutoLoad, {AutoloadPluginOptions} from '@fastify/autoload';
import websocket from '@fastify/websocket';

export type AppOptions = {
    // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>;


// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {}

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
    await fastify.register(websocket, {
        errorHandler: function (error, conn /* SocketStream */, req /* FastifyRequest */, reply /* FastifyReply */) {
            console.log(error);
            conn.destroy(error);
        }
    });
    await fastify.register(cors, {});

    // Do not touch the following lines
    // This loads all plugins defined in plugins
    // those should be support plugins that are reused
    // through your application
    void fastify.register(AutoLoad, {
        dir: join(__dirname, 'plugins'),
        options: opts
    });
    // This loads all plugins defined in routes
    // define your routes in one of these
    void fastify.register(AutoLoad, {
        dir: join(__dirname, 'routes'),
        options: opts
    });
};

export default app;
export {app, options}
