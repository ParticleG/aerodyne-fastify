import { WsAction } from './WsAction';
import { WsRequest } from './WsRequest';
import { OicqAccount } from 'src/types/common';

type WsResult = 'success' | 'failure' | 'error';

export class WsResponse extends WsRequest {
  result: WsResult;

  constructor(
    result: WsResult,
    action?: WsAction,
    account?: OicqAccount,
    data?: any
  ) {
    super(action, account, data);
    this.result = result;
  }

  toString() {
    return JSON.stringify({
      result: this.result,
      action: this.action,
      account: this.account,
      data: this.data,
    });
  }
}
