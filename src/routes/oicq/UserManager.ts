import * as chalk from "chalk";
import { mkdirSync, readdirSync } from "fs";
import { Platform } from "icqq";
import { join, resolve } from "path";

import OicqClient from "./OicqClient";
import WsConnection from "./WsConnection";
import { OicqAccount, UserId } from "../../types";
import { Logger } from "../../utils";

type ClientMapType = Map<OicqAccount, OicqClient>;
type UserMapType = Map<UserId, ClientMapType>;

class ClientMap extends Map<OicqAccount, OicqClient> {}

class UserMap extends Map<UserId, ClientMapType> {}

class UserManager {
  private userMap: UserMapType = new UserMap();

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
    return Array.from(this.userMap.get(userId)?.keys() ?? []);
  }

  connectClient(wsConnection: WsConnection, account: OicqAccount): boolean {
    if (!this.userMap.has(wsConnection.userId)) {
      this.userMap.set(wsConnection.userId, new ClientMap());
    }
    const clientMap = this.userMap.get(wsConnection.userId)!;
    if (!clientMap.has(account)) {
      clientMap.set(account, new OicqClient(Platform.Android, account));
    }
    const oicqClient = clientMap.get(account)!;
    return oicqClient.subscribe(wsConnection);
  }

  removeClient({ userId, wsId }: WsConnection, account: OicqAccount) {
    this.userMap.get(userId)?.get(account)?.unsubscribe(wsId);
  }
}

export default new UserManager();
