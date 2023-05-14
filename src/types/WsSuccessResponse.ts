import { WsResponse } from './WsResponse';
import { WsAction } from './WsAction';
import { WsRequest } from './WsRequest';
import { OicqAccount } from 'src/types/common';

export class WsSuccessResponse extends WsResponse {
  constructor(action: WsAction, account?: OicqAccount, data?: any) {
    super('success', action, account, data);
  }

  static fromRequest(request: WsRequest, account?: OicqAccount, data?: any) {
    return new this(request.action, account, data);
  }
}
