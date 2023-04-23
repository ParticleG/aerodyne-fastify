import * as chalk from "chalk";
import { mkdirSync, readdirSync } from "fs";
import { Platform } from "icqq";
import { join, resolve } from "path";

import OicqClient from "./OicqClient";
import WsConnection from "./WsConnection";
import { OicqAccount } from "../../types/common";
import { Logger } from "../../types/Logger";

type ClientMapType = Map<OicqAccount, OicqClient>;

class ClientMap extends Map<OicqAccount, OicqClient> {}

class UserManager {
  private clientMap: ClientMapType = new ClientMap();

  constructor() {
    const dataDir = resolve(join(process.cwd(), "data"));
    Logger.info(
      "UserManager",
      "Scanning client tokens in " + chalk.underline(`"${dataDir}"`)
    );
    try {
      const accounts = readdirSync(dataDir)
        .filter((file) => {
          return file.match(/.*\.(token?)/gi);
        })
        .map((file) => {
          return file.substring(0, file.length - 6);
        });
      if (accounts.length > 0) {
        Logger.info(
          "UserManager",
          "Auto login for these accounts: \n\t" + accounts.join("\n\t")
        );
      } else {
        Logger.hint("UserManager", "No account found");
      }
    } catch (_) {
      Logger.warn("UserManager", "Data directory not found, create one");
      mkdirSync(dataDir);
    }
  }

  listClients({ userId }: WsConnection): OicqAccount[] {
    return Array.from(this.clientMap.keys() ?? []);
  }

  connectClient(
    wsConnection: WsConnection,
    account: OicqAccount,
    password?: string
  ): boolean {
    if (!this.clientMap.has(account)) {
      this.clientMap.set(account, new OicqClient(Platform.Android, account));
    }
    const oicqClient = this.clientMap.get(account)!;
    return oicqClient.subscribe(wsConnection, password);
  }

  removeClient({ wsId }: WsConnection, account: OicqAccount) {
    this.clientMap.get(account)?.unsubscribe(wsId);
  }
}

export default new UserManager();