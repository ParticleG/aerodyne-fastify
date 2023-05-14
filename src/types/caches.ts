import { Anonymous, Friend, Group, MemberInfo } from 'icqq';

export class FriendCache {
  lastUpdate: Date = new Date();
  avatarUrl: string;
  age: number;
  area: string;

  constructor(avatarUrl: string, age: number, area: string) {
    this.avatarUrl = avatarUrl;
    this.age = age;
    this.area = area;
  }

  async update(friend: Friend) {
    const simpleInfo = await friend.getSimpleInfo();
    this.avatarUrl = friend.getAvatarUrl(40);
    this.age = simpleInfo.age;
    this.area = simpleInfo.area;
  }
}

export const newFriendCache = async (friend: Friend) => {
  const simpleInfo = await friend.getSimpleInfo();
  return new FriendCache(
    friend.getAvatarUrl(40),
    simpleInfo.age,
    simpleInfo.area
  );
};

export class GroupCache {
  lastUpdate: Date = new Date();
  anonymous: Omit<Anonymous, 'flag'>;
  memberMap: Map<number, MemberInfo>;
  avatarUrl: string;
  atAllRemainder: number;

  constructor(
    anonymous: Omit<Anonymous, 'flag'>,
    memberMap: Map<number, MemberInfo>,
    avatarUrl: string,
    atAllRemainder: number
  ) {
    this.anonymous = anonymous;
    this.memberMap = memberMap;
    this.avatarUrl = avatarUrl;
    this.atAllRemainder = atAllRemainder;
  }

  async update(group: Group) {
    this.anonymous = await group.getAnonyInfo();
    this.memberMap = await group.getMemberMap();
    this.avatarUrl = group.getAvatarUrl(40);
    this.atAllRemainder = await group.getAtAllRemainder();
  }
}

export const newGroupCache = async (group: Group) => {
  return new GroupCache(
    await group.getAnonyInfo(),
    await group.getMemberMap(),
    group.getAvatarUrl(40),
    await group.getAtAllRemainder()
  );
};
