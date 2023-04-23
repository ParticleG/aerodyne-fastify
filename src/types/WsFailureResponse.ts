import { WsResponse } from "./WsResponse";
import { WsAction } from "./WsAction";
import { WsRequest } from "./WsRequest";

export class WsFailureResponse extends WsResponse {
  data: {
    message: string;
    reasons?: string[];
  };

  constructor(action: WsAction, message?: string, reasons?: string[]) {
    super("failure", action);
    this.data = {
      message: message || "Unknown error",
      reasons: reasons,
    };
  }

  static fromRequest(request: WsRequest, message?: string, reasons?: string[]) {
    return new this(request.action, message, reasons);
  }
}
