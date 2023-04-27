import { WsAction } from './WsAction';
import { WsRequest } from './WsRequest';

type WsResult = 'success' | 'failure' | 'error';

export class WsResponse extends WsRequest {
  result: WsResult;

  constructor(result: WsResult, action?: WsAction, data?: any) {
    super(action, data);
    this.result = result;
  }

  toString() {
    return JSON.stringify({
      result: this.result,
      action: this.action,
      data: this.data,
    });
  }
}
