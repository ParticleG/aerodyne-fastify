import { FastifyPluginAsync } from 'fastify';

export default <FastifyPluginAsync>(async (fastify): Promise<void> => {
  fastify.get('/avatar', async (request) => {
    const body: any = request.body;
    console.log(body);
    return {};
  });
  fastify.get('/info', async (request) => {
    const body: any = request.body;
    console.log(body);
    return {};
  });
  fastify.put('/info', async (request) => {
    const body: any = request.body;
    console.log(body);
    return {};
  });
});
