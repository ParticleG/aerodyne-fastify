import { WsAction } from "./WsAction";

export class WsRequest {
  action: WsAction;
  data: any;

  constructor(action?: WsAction, data?: any) {
    if (action === undefined || !Object.values(WsAction).includes(action)) {
      this.action = WsAction.Invalid;
    } else {
      this.action = action;
    }
    this.data = data;
  }
}
