import { OicqAccount, UserId } from "./types";
import OicqClient from "./OicqClient";
import { Platform } from "icqq";
import WsConnection from "./WsConnection";

type ClientMapType = Map<OicqAccount, OicqClient>;

class ClientMap extends Map<OicqAccount, OicqClient> {}

class UserManager {
  private userMap: Map<UserId, ClientMapType> = new Map<
    UserId,
    ClientMapType
  >();

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
