import {FastifyPluginAsync} from "fastify";
import {loginSchema} from "./schema";
import {parseJsonMessage} from "./types";

const oicq: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.get('/', {websocket: true}, (connection, req) => {
        console.log(req);
        connection.socket.on('message', message => {
            console.log("Client: " + message.toString());
            console.log("Parsed: ", parseJsonMessage(message.toString()));
            connection.socket.send('hi from server')
        });
    });
    fastify.post<{
        Body: { account: number; password: string; }
    }>('/login', {schema: loginSchema}, async (request, reply) => {
        const {account, password} = request.body;
        return await fastify.login(account, password);
    });
    fastify.post<{
        Body: { account: number; payload: string; }
    }>('/postLogin', async (request, reply) => {
        const {account, payload} = request.body;
        return await fastify.postLogin(account, payload);
    });
}

export default oicq;