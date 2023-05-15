export type OicqAccount = number;
export type UserId = number;
export type WsId = string;

export enum ClientState {
  Initializing = 'Initializing',
  Offline = 'Offline',
  WaitingSmsCode = 'WaitingSmsCode',
  WaitingQRCode = 'WaitingQRCode',
  WaitingSlider = 'WaitingSlider',
  Online = 'Online',
}

export enum WsAction {
  Invalid = 'Invalid',
  Monitor = 'Monitor',
  List = 'List',
  Subscribe = 'Subscribe',
  Login = 'Login',
  Logout = 'Logout',
  Message = 'Message',
  ClientInfo = 'ClientInfo',
}
