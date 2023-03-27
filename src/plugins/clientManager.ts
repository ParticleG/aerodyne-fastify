import fp from "fastify-plugin";
import { Client } from "icqq/lib/client";
import { Platform } from "icqq/lib/core";
import { createClient } from "icqq";
import { WebSocket } from "ws";
import { ErrorMessage, WsAction } from "../routes/oicq/types";

type oicqAccount = number;

enum ClientState {
  Null = -1,
  Initializing,
  WaitingSmsCode,
  WaitingQRCode,
  WaitingSlider,
  Online,
}

class ClientWrapper {
  constructor(platform: Platform) {
    this.client = createClient({ log_level: "warn", platform: platform });
    this.state = ClientState.Initializing;
    this.client.on("message", (e: any) => {
      console.log(e);
    });
  }

  subscribe(socket: WebSocket) {
    this.client.on("system.login.device", (e: any) => {
      socket.send(JSON.stringify({ state: this.state, data: e }));
      this.client.sendSmsCode();
    });
    this.client.on("system.login.qrcode", (e: any) => {
      socket.send(JSON.stringify({ state: this.state, data: e }));
    });
    this.client.on("system.login.slider", (e: any) => {
      socket.send(JSON.stringify({ state: this.state, data: e }));
    });
    this.client.on("system.online", () => {
      socket.send(JSON.stringify({ state: this.state }));
    });
    this.client.on("system.login.error", (e: any) => {
      socket.send(JSON.stringify({ state: this.state, data: e }));
    });
  }

  login(account: number, password?: string) {
    const loginPromise = this.getLoginPromise();
    this.client.login(account, password).then();
    return loginPromise;
  }

  postLogin(payload?: string) {
    const loginPromise = this.getLoginPromise();
    switch (this.state) {
      case ClientState.WaitingSmsCode:
        if (!payload) {
          throw new Error("Missing Sms code");
        }
        this.client.submitSmsCode(payload.trim());
        break;
      case ClientState.WaitingQRCode:
        this.client.login().then();
        break;
      case ClientState.WaitingSlider:
        if (!payload) {
          throw new Error("Missing login ticket");
        }
        this.client.submitSlider(payload.trim());
        break;
    }

    return loginPromise;
  }

  client: Client;
  state: ClientState;
  socket?: WebSocket;

  private getLoginPromise() {
    return new Promise<any>((resolve, reject) => {
      this.client.on("system.login.device", (e: any) => {
        this.state = ClientState.WaitingSmsCode;
        resolve({ state: this.state, data: e });
        this.client.sendSmsCode();
      });
      this.client.on("system.login.qrcode", (e: any) => {
        this.state = ClientState.WaitingQRCode;
        resolve({ state: this.state, data: e });
      });
      this.client.on("system.login.slider", (e: any) => {
        this.state = ClientState.WaitingSlider;
        resolve({ state: this.state, data: e });
      });
      this.client.on("system.online", () => {
        this.state = ClientState.Online;
        resolve({ state: this.state });
      });
      this.client.on("system.login.error", (e: any) => {
        reject({ state: this.state, data: e });
      });
    });
  }
}

const clientsTable = new Map<oicqAccount, ClientWrapper>();

export default fp(async (fastify, opts) => {
  fastify.decorate(
    "subscribe",
    (
      socket: WebSocket,
      account: number,
      platform: Platform = Platform.Watch
    ) => {
      console.log(clientsTable.has(account));
      if (clientsTable.get(account)?.socket !== undefined) {
        throw new ErrorMessage(
          "Account has already been bound to another user",
          WsAction.Subscribe
        );
      }
      return clientsTable.set(account, new ClientWrapper(Platform.iPad));
    }
  );
  fastify.decorate("login", (account: number, password?: string) => {
    console.log(clientsTable.has(account));
    if (clientsTable.has(account)) {
      return { state: ClientState.Null };
    }
    return clientsTable
      .set(
        account,
        new ClientWrapper(password ? Platform.iPad : Platform.Watch)
      )
      .get(account)
      ?.login(account, password);
  });
  fastify.decorate("postLogin", (account: number, payload?: string) => {
    console.log(clientsTable.has(account));
    if (!clientsTable.has(account)) {
      return { state: ClientState.Null };
    }
    return clientsTable.get(account)?.postLogin(payload);
  });
});

declare module "fastify" {
  export interface FastifyInstance {
    subscribe(socket: WebSocket, account: number): boolean;
  }
}
