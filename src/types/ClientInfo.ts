import { FriendInfo, Gender, GroupInfo, OnlineStatus } from 'icqq';
import { FriendCache, GroupCache } from 'src/types/caches';
import { ClientState, OicqAccount } from "src/types/common";

export interface FriendData extends FriendInfo, FriendCache {}

export interface GroupData extends GroupInfo, GroupCache {}

export interface ClientInfo {
  account: OicqAccount;
  state: ClientState;
  avatarUrl: string;
  status: OnlineStatus;
  nickname: string;
  sex: Gender;
  age: number;
  friends: Record<number, FriendData>;
  groups: Record<number, GroupData>;
}
