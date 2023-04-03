type UserId = number;
type OicqAccount = number;
type UUID = string;
type WsResult = "success" | "failure" | "error";

enum WsAction {
  Invalid = "Invalid",
  Monitor = "Monitor",
  List = "List",
  Subscribe = "Subscribe",
  Login = "Login",
  Logout = "Logout",
  Message = "Message",
}

enum ClientState {
  Null = -1,
  Offline,
  WaitingSmsCode,
  WaitingQRCode,
  WaitingSlider,
  Online,
}

class WsRequest {
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

class WsResponse extends WsRequest {
  result: WsResult;
  message?: string;
  reasons?: string[];
  constructor(
    result: WsResult,
    action?: WsAction,
    data?: any,
    message?: string,
    reasons?: string[]
  ) {
    super(action, data);
    this.result = result;
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
  constructor(action: WsAction, data?: any) {
    super("success", action, data);
  }

  static fromRequest(request: WsRequest, data?: any) {
    return new this(request.action, data);
  }
}

class WsFailureResponse extends WsResponse {
  constructor(action: WsAction, message?: string, reasons?: string[]) {
    super("failure", action, undefined, message, reasons);
  }

  static fromRequest(request: WsRequest, message?: string, reasons?: string[]) {
    return new this(request.action, message, reasons);
  }
}

class WsErrorResponse extends WsResponse {
  constructor(action: WsAction, message?: string, reasons?: string[]) {
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
