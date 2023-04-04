import { mkdirSync, readdirSync } from "fs";
import { Platform } from "icqq";
import { join, resolve } from "path";

import OicqClient from "./OicqClient";
import WsConnection from "./WsConnection";
import { OicqAccount, UserId } from "./types";

type ClientMapType = Map<OicqAccount, OicqClient>;
type UserMapType = Map<UserId, ClientMapType>;

class ClientMap extends Map<OicqAccount, OicqClient> {}

class UserMap extends Map<UserId, ClientMapType> {}

class UserManager {
  private userMap: UserMapType = new UserMap();

  constructor() {
    const dataDir = resolve(join(require?.main?.path || process.cwd(), "data"));
    console.info(`[UserManager] Scanning client tokens in "${dataDir}".`);
    try {
      const accounts = readdirSync(dataDir)
        .filter((file) => {
          return file.match(/.*\.(token?)/gi);
        })
        .map((file) => {
          return file.substring(0, file.length - 6);
        });
      if (accounts.length > 0) {
        console.info("[UserManager] Auto login for these accounts: ");
        accounts.forEach((account) => {
          console.info(`[UserManager]   ${account}`);
        });
      } else {
        console.info("[UserManager] No account found");
      }
    } catch (_) {
      console.info("[UserManager] Data directory not found, create one.");
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
