import { FriendInfo, Gender, GroupInfo, OnlineStatus } from "icqq";
import { FriendCache, GroupCache } from 'src/types/caches';
import { OicqAccount } from "src/types/common";

export interface FriendData extends FriendInfo, FriendCache {}

export interface GroupData extends GroupInfo, GroupCache {}

export interface ClientInfo {
  account: OicqAccount;
  status: OnlineStatus;
  nickname: string;
  sex: Gender;
  age: number;
  friendList: FriendData[];
  groupList: GroupData[];
}
