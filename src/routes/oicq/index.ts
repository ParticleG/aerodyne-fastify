import {FastifyPluginAsync} from "fastify";
import {loginSchema} from "./schema";

import {createClient} from "oicq";

interface LoginBody {
    account: number;
    password: string;
}

enum LoginType {
    Device,
    QRCode,
    Slider
}

const oicq: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.post<{ Body: LoginBody }>('/login', {schema: loginSchema}, (request, reply) => {
        const {account, password} = request.body;
        const client = createClient(account, {log_level: "warn"});
        client.on("system.online", () => console.log("Logged in!"))
        client.on("message", (e: any) => {
            console.log(e)
        })
        client.on("system.login.device", (e: any) => {
            console.log(e);
            reply.send({type: LoginType.Device, data: e});
            client.sendSmsCode();
            process.stdin.once("data", code => client.submitSmsCode(String(code).trim()))
        });
        client.on("system.login.qrcode", (e: any) => {
            reply.send({type: LoginType.QRCode, data: e});
            process.stdin.once("data", () => client.login());
        });
        client.on("system.login.slider", (e: any) => {
            reply.send({type: LoginType.Slider, data: e});
            process.stdin.once("data", ticket => client.submitSlider(String(ticket).trim()))
        });
        client.login(password ? password : undefined);
    });
}

export default oicq;