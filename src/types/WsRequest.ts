import { OicqAccount } from 'src/types/common';
import { WsAction } from 'src/types/WsAction';

export class WsRequest {
  action: WsAction;
  account?: OicqAccount;
  data: any;

  constructor(action?: WsAction, account?: OicqAccount, data?: any) {
    if (action === undefined || !Object.values(WsAction).includes(action)) {
      this.action = WsAction.Invalid;
    } else {
      this.action = action;
    }
    this.account = account;
    this.data = data;
  }
}
