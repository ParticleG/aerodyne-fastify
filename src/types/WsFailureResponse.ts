import { WsResponse } from './WsResponse';
import { WsAction } from './WsAction';
import { WsRequest } from './WsRequest';
import { OicqAccount } from 'src/types/common';

export class WsFailureResponse extends WsResponse {
  data: {
    message: string;
    reasons?: string[];
  };

  constructor(
    action: WsAction,
    account?: OicqAccount,
    message?: string,
    reasons?: string[]
  ) {
    super('failure', action, account);
    this.data = {
      message: message || 'Unknown error',
      reasons: reasons ?? [],
    };
  }

  static fromRequest(
    request: WsRequest,
    account?: OicqAccount,
    message?: string,
    reasons?: string[]
  ) {
    return new this(request.action, account, message, reasons);
  }
}
