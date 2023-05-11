import { mkdirSync, readdirSync } from 'fs';
import { Platform } from 'icqq';
import { join, resolve } from 'path';

import { OicqClient } from 'src/types/OicqClient';
import { WsConnection } from 'src/types/WsConnection';
import { Logger, LogLevel } from 'src/types/Logger';
import { OicqAccount } from 'src/types/common';
import { ClientState } from 'src/types/ClientState';

type ClientMapType = Map<OicqAccount, OicqClient>;

class ClientMap extends Map<OicqAccount, OicqClient> {}

class ClientManager {
  private clientMap: ClientMapType = new ClientMap();

  constructor() {
    const dataDir = resolve(join(process.cwd(), 'data'));
    Logger.info(
      'UserManager',
      'Scanning client tokens in ' + LogLevel.link(dataDir)
    );
    try {
      const accounts = readdirSync(dataDir)
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
                new OicqClient(Platform.Android, account)
              );
            }
            const oicqClient = this.clientMap.get(account)!;
            oicqClient.login();
          });
      } else {
        Logger.hint('UserManager', LogLevel.verbose('No account found'));
      }
    } catch (e) {
      console.log(e);
      Logger.warn('UserManager', 'Data directory not found, create one');
      mkdirSync(dataDir);
    }
  }

  connectClient(
    wsConnection: WsConnection,
    account: OicqAccount
  ): ClientState | undefined {
    if (!this.clientMap.has(account)) {
      this.clientMap.set(account, new OicqClient(Platform.Android, account));
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
