import { WsResponse } from './WsResponse';
import { WsAction } from './WsAction';
import { WsRequest } from './WsRequest';

export class WsSuccessResponse extends WsResponse {
  constructor(action: WsAction, data?: any) {
    super('success', action, data);
  }

  static fromRequest(request: WsRequest, data?: any) {
    return new this(request.action, data);
  }
}
