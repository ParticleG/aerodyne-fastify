import { mkdirSync, readdirSync, writeFileSync } from 'fs';
import { Platform } from 'icqq';
import { join, resolve } from 'path';

import { Logger, LogLevel } from 'src/types/Logger';
import { OicqClient } from 'src/types/OicqClient';
import { WsConnection } from 'src/types/WsConnection';
import { FriendCache, GroupCache } from 'types/caches';
import { ClientState, OicqAccount, UserId } from 'src/types/common';

class ClientMap extends Map<OicqAccount, OicqClient> {}

class ClientManager {
  private clientMap = new ClientMap();
  private dataDir = resolve(join(process.cwd(), 'data'));

  constructor() {
    Logger.info(
      'UserManager',
      'Scanning client tokens in ' + LogLevel.link(this.dataDir)
    );
    try {
      const accounts = readdirSync(this.dataDir)
        .filter((file) => {
          return file.match(/.*_(token?)/gi);
        })
        .map((file) => {
          return file.substring(0, file.length - 6);
        });
      if (accounts.length > 0) {
        Logger.info(
          'UserManager',
          'Auto login for these accounts: \n\t' + accounts.join('\n\t')
        );
        accounts
          .map((account) => Number(account))
          .forEach((account) => {
            if (!this.clientMap.has(account)) {
              this.clientMap.set(
                account,
                new OicqClient(Platform.old_Android, account)
              );
            }
            const oicqClient = this.clientMap.get(account)!;
            oicqClient.login();
          });
      } else {
        Logger.hint('UserManager', LogLevel.verbose('No account found'));
      }
    } catch (_) {
      Logger.warn('UserManager', 'Data directory not found, create one');
      mkdirSync(this.dataDir);
    }
  }

  shutdown() {
    const result: {
      groupCaches: Map<number, GroupCache>;
      friendCaches: Map<number, FriendCache>;
      allowedUsers: UserId[];
      account: number;
    }[] = [];
    this.clientMap.forEach((client) => {
      result.push(client.shutdown());
    });
    writeFileSync(this.dataDir + '/clients.json', JSON.stringify(result));
  }

  connectClient(
    wsConnection: WsConnection,
    account: OicqAccount
  ): ClientState | undefined {
    if (!this.clientMap.has(account)) {
      this.clientMap.set(
        account,
        new OicqClient(Platform.old_Android, account)
      );
    }
    const oicqClient = this.clientMap.get(account)!;
    return oicqClient.subscribe(wsConnection);
  }

  listClients(): OicqAccount[] {
    return Array.from(this.clientMap.keys() ?? []);
  }

  loginClient(account: number, payload?: string): boolean {
    if (this.clientMap.has(account)) {
      this.clientMap.get(account)?.login(payload);
      return true;
    }
    return false;
  }

  // noinspection JSUnusedGlobalSymbols
  removeClient({ wsId }: WsConnection, account: OicqAccount) {
    this.clientMap.get(account)?.unsubscribe(wsId);
  }
}

const ClientManagerInstance = new ClientManager();

export { ClientManagerInstance as ClientManager };
