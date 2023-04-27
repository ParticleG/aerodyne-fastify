import { FastifyPluginAsync } from 'fastify';

export default <FastifyPluginAsync>(async (fastify): Promise<void> => {
  fastify.post('/login', async (request) => {
    const body: any = request.body;
    console.log(body);
    return {};
  });
  fastify.put('/migrate', async (request) => {
    const body: any = request.body;
    console.log(body);
    return {};
  });
  fastify.post('/nullify', async (request) => {
    const body: any = request.body;
    console.log(body);
    return {};
  });
  fastify.put('/reset', async (request) => {
    const body: any = request.body;
    console.log(body);
    return {};
  });
  fastify.post('/seed', async (request) => {
    const body: any = request.body;
    console.log(body);
    return {};
  });
  fastify.post('/verify', async (request) => {
    const body: any = request.body;
    console.log(body);
    return {};
  });
});
