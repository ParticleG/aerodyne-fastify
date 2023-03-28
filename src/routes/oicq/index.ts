import { FastifyPluginAsync } from "fastify";
import { parseWsMessage } from "./utils";

const oicq: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", { websocket: true }, (connection, req) => {
    const socket = connection.socket;
    socket.on("message", (message) => {
      try {
        const wsMessage = parseWsMessage(message.toString());
        console.log(JSON.stringify(wsMessage, null, 2));
        socket.send("hi from server");
      } catch (errorMessage: any) {
        if (errorMessage.isFatal) {
          socket.close(1011, errorMessage.toString());
        } else {
          socket.send(errorMessage.toString());
        }
      }
    });
  });
};

export default oicq;
