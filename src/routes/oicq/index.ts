import {FastifyPluginAsync} from "fastify";
// const {createClient} = require("oicq");
const {loginSchema} = require("./schema");
const oicq: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.post('/login', {schema: loginSchema}, async (request, reply) => {
        console.log(request.body);
        return {};
    });
}

export default oicq;