type UserId = number;
type OicqAccount = number;
type UUID = string;
type WsResult = "success" | "failure" | "error";

enum WsAction {
  Invalid = -1,
  Monitor,
  Subscribe,
  Login,
  Validate,
  Message,
}

enum ClientState {
  Null = -1,
  Initializing,
  WaitingSmsCode,
  WaitingQRCode,
  WaitingSlider,
  Online,
}

interface WsRequest {
  action: WsAction;
  data: any;
}

interface WsResponse extends WsRequest {
  result: WsResult;
  message?: string;
  reasons?: string[];
}

class WsResponse {
  constructor(
    result: WsResult,
    action?: number,
    data?: any,
    message?: string,
    reasons?: string[]
  ) {
    this.result = result;
    if (action === undefined || !Object.values(WsAction).includes(action)) {
      this.action = WsAction.Invalid;
    } else {
      this.action = action;
    }
    this.data = data;
    this.message = message;
    this.reasons = reasons;
  }

  toString() {
    return JSON.stringify({
      result: this.result,
      action: this.action,
      data: this.data,
      message: this.message,
      reasons: this.reasons,
    });
  }
}

class WsSuccessResponse extends WsResponse {
  constructor(action: number, data?: any) {
    super("success", action, data);
  }

  static fromRequest(request: WsRequest, data?: any) {
    return new this(request.action, data);
  }
}

class WsFailureResponse extends WsResponse {
  constructor(action: number, message?: string, reasons?: string[]) {
    super("failure", action, undefined, message, reasons);
  }

  static fromRequest(request: WsRequest, message?: string, reasons?: string[]) {
    return new this(request.action, message, reasons);
  }
}

class WsErrorResponse extends WsResponse {
  constructor(action: number, message?: string, reasons?: string[]) {
    super("error", action, undefined, message, reasons);
  }

  static fromRequest(request: WsRequest, message?: string, reasons?: string[]) {
    return new this(request.action, message, reasons);
  }
}

export {
  UserId,
  OicqAccount,
  UUID,
  WsAction,
  ClientState,
  WsRequest,
  WsResponse,
  WsSuccessResponse,
  WsFailureResponse,
  WsErrorResponse,
};
