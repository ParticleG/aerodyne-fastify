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

  connectClient(wsConnection: WsConnection, account: OicqAccount) {
    if (!this.userMap.has(wsConnection.userId)) {
      this.userMap.set(wsConnection.userId, new ClientMap());
    }
    const clientMap = this.userMap.get(wsConnection.userId)!;
    if (!clientMap.has(account)) {
      clientMap.set(account, new OicqClient(Platform.Watch, account));
    }
    const oicqClient = clientMap.get(account)!;
    oicqClient.subscribe(wsConnection);
  }

  removeClient(wsConnection: WsConnection, account: OicqAccount) {
    const clientMap = this.userMap.get(wsConnection.userId);
    if (clientMap !== undefined) {
      clientMap.delete(account);
    }
  }
}

export default new UserManager();
