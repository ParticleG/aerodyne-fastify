import { createClient, Friend, Group, Message } from 'icqq';
import { Client } from 'icqq/lib/client';
import { Platform } from 'icqq/lib/core';
import {
  DiscussMessageEvent,
  GroupMessageEvent,
  PrivateMessageEvent,
} from 'icqq/lib/events';

import { ClientInfo, FriendData, GroupData } from 'types/ClientInfo';
import { WsConnection } from 'types/WsConnection';
import {
  FriendCache,
  GroupCache,
  newFriendCache,
  newGroupCache,
} from 'types/caches';
import { ClientState, OicqAccount, UserId, WsAction, WsId } from 'types/common';
import {
  WsFailureResponse,
  WsResponse,
  WsSuccessResponse,
} from 'types/websocket';
import { getAvatarUrl } from 'utils/common';

export class OicqClient {
  readonly account: OicqAccount;
  private readonly allowedUsers: UserId[] = [];
  private readonly friendCaches = new Map<number, FriendCache>();
  private readonly groupCaches = new Map<number, GroupCache>();

  private state: ClientState;
  private readonly client: Client;
  private connectionMap = new Map<WsId, WsConnection>();
  private friendList = new Map<number, Friend>();
  private groupList = new Map<number, Group>();

  constructor(
    platform: Platform,
    account: OicqAccount,
    allowedUsers?: UserId[],
    friendCaches?: Map<number, FriendCache>,
    groupCaches?: Map<number, GroupCache>
  ) {
    this.account = account;
    this.state = ClientState.Initializing;
    this.client = createClient({ log_level: 'warn', platform: platform });
    if (allowedUsers) {
      this.allowedUsers = allowedUsers;
    }
    if (friendCaches) {
      this.friendCaches = friendCaches;
    }
    if (groupCaches) {
      this.groupCaches = groupCaches;
    }

    this.client.on(
      'message',
      (
        event: PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent
      ) => {
        this.broadcast(
          new WsSuccessResponse(
            WsAction.Message,
            this.account,
            event as Message
          )
        );
      }
    );

    this.client.on(
      'system.login.device',
      (event: { url: string; phone: string }) => {
        this.state = ClientState.WaitingSmsCode;
        this.client.sendSmsCode();
        this.broadcast(
          new WsSuccessResponse(WsAction.Login, this.account, {
            state: this.state,
            ...event,
          })
        );
      }
    );
    this.client.on('system.login.qrcode', (event: { image: Buffer }) => {
      this.state = ClientState.WaitingQRCode;
      this.broadcast(
        new WsSuccessResponse(WsAction.Login, this.account, {
          state: this.state,
          ...event,
        })
      );
    });
    this.client.on('system.login.slider', (event: { url: string }) => {
      this.state = ClientState.WaitingSlider;
      this.broadcast(
        new WsSuccessResponse(WsAction.Login, this.account, {
          state: this.state,
          ...event,
        })
      );
    });
    this.client.on('system.login.error', ({ code, message }) => {
      this.state = ClientState.Initializing;
      this.broadcast(
        new WsFailureResponse(WsAction.Login, this.account, message, [
          JSON.stringify({ code: code }),
        ])
      );
    });

    this.client.on('system.online', async () => {
      this.state = ClientState.Online;
      const hasFriendCache = this.friendCaches.size > 0;
      const hasGroupCache = this.groupCaches.size > 0;
      for (const [id] of this.client.fl) {
        if (!this.friendList.has(id)) {
          this.friendList.set(id, this.client.pickFriend(id));
        }
        if (!this.friendCaches.has(id)) {
          const friend = this.friendList.get(id)!;
          if (hasFriendCache) {
            newFriendCache(friend).then((friendCache) =>
              this.friendCaches.set(id, friendCache)
            );
          } else {
            this.friendCaches.set(id, await newFriendCache(friend));
          }
        }
      }
      for (const [id] of this.client.gl) {
        if (!this.groupList.has(id)) {
          this.groupList.set(id, this.client.pickGroup(id));
        }
        if (!this.groupCaches.has(id)) {
          const group = this.groupList.get(id)!;
          if (hasGroupCache) {
            newGroupCache(group).then((groupCache) =>
              this.groupCaches.set(id, groupCache)
            );
          } else {
            this.groupCaches.set(id, await newGroupCache(group));
          }
        }
      }
      // TODO: Implement cache update
      this.broadcast(new WsSuccessResponse(WsAction.Login, this.account));
    });

    this.client.on('system.offline.kickoff', ({ message }) => {
      this.state = ClientState.Offline;
      this.broadcast(
        new WsFailureResponse(WsAction.Logout, this.account, message, [
          'Kicked off',
        ])
      );
    });
    this.client.on('system.offline.network', ({ message }) => {
      this.state = ClientState.Offline;
      this.broadcast(
        new WsFailureResponse(WsAction.Logout, this.account, message, [
          'Network',
        ])
      );
    });
  }

  shutdown() {
    return {
      account: this.account,
      allowedUsers: this.allowedUsers,
      friendCaches: this.friendCaches,
      groupCaches: this.groupCaches,
    };
  }

  subscribe(wsConnection: WsConnection): ClientState | undefined {
    if (this.allowedUsers.length === 0) {
      this.allowedUsers.push(wsConnection.userId);
    }
    if (wsConnection.userId in this.allowedUsers) {
      this.connectionMap.set(wsConnection.wsId, wsConnection);
      wsConnection.subscribe(this);
      console.log(
        "[Subscribe]Client's subscriber map size: ",
        this.connectionMap.size
      );
      return this.state;
    }
  }

  unsubscribe(wsId: WsId) {
    this.connectionMap.delete(wsId);
    console.log(
      "[Unsubscribe]Client's subscriber map size: ",
      this.connectionMap.size
    );
  }

  login(payload?: string) {
    switch (this.state) {
      case ClientState.Initializing: {
        this.client.login(this.account, payload).then();
        break;
      }
      case ClientState.WaitingSmsCode: {
        if (!payload) {
          throw new WsFailureResponse(
            WsAction.Login,
            this.account,
            'Missing sms code',
            [JSON.stringify({ state: this.state })]
          );
        }
        this.client.submitSmsCode(payload.trim()).then();
        break;
      }
      case ClientState.WaitingQRCode: {
        this.client.login().then();
        break;
      }
      case ClientState.WaitingSlider: {
        if (!payload) {
          throw new WsFailureResponse(
            WsAction.Login,
            this.account,
            'Missing login ticket',
            [JSON.stringify({ state: this.state })]
          );
        }
        this.client.submitSlider(payload.trim()).then();
        break;
      }
      case ClientState.Online: {
        throw new WsFailureResponse(
          WsAction.Login,
          this.account,
          'Already online',
          [JSON.stringify({ state: this.state })]
        );
      }
    }
  }

  broadcast(wsResponse: WsResponse) {
    if (wsResponse.data === undefined) {
      wsResponse.data = {};
    }
    wsResponse.data.state = this.state;
    this.connectionMap.forEach((connection) => {
      connection.respond(wsResponse);
    });
  }

  async getInfo(): Promise<ClientInfo> {
    let friends: Record<number, FriendData> = {};
    let groups: Record<number, GroupData> = {};
    for (const [id, friendInfo] of this.client.fl) {
      if (!this.friendCaches.has(id)) {
        this.friendCaches.set(
          id,
          await newFriendCache(this.friendList.get(id)!)
        );
      }
      const friendCache = this.friendCaches.get(id)!;
      friends[id] = <FriendData>{
        ...friendInfo,
        ...friendCache,
      };
    }
    for (const [id, groupInfo] of this.client.gl) {
      if (!this.groupCaches.has(id)) {
        this.groupCaches.set(id, await newGroupCache(this.groupList.get(id)!));
      }
      const groupCache = this.groupCaches.get(id)!;
      groups[id] = <GroupData>{
        ...groupInfo,
        ...groupCache,
      };
    }
    return {
      account: this.client.uin,
      state: this.state,
      avatarUrl: getAvatarUrl(this.client.uin),
      status: this.client.status,
      nickname: this.client.nickname,
      sex: this.client.sex,
      age: this.client.age,
      friends: friends,
      groups: groups,
    };
  }
}
