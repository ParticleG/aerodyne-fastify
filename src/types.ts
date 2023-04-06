import { ValidateFunction } from "ajv/dist/jtd";

type OicqAccount = number;
type UserId = number;
type UUID = string;
type ValidatorMapType = Map<WsAction, ValidateFunction>;
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

class ValidatorMap extends Map<WsAction, ValidateFunction> {}

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

class WsSuccessResponse extends WsResponse {
  constructor(action: WsAction, data?: any) {
    super("success", action, data);
  }

  static fromRequest(request: WsRequest, data?: any) {
    return new this(request.action, data);
  }
}

class WsFailureResponse extends WsResponse {
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

class WsErrorResponse extends WsResponse {
  data: {
    message: string;
    reasons?: string[];
  };
  constructor(action: WsAction, message?: string, reasons?: string[]) {
    super("error", action);
    this.data = {
      message: message || "Unknown error",
      reasons: reasons,
    };
  }

  static fromRequest(request: WsRequest, message?: string, reasons?: string[]) {
    return new this(request.action, message, reasons);
  }
}

export {
  OicqAccount,
  UserId,
  UUID,
  ValidatorMapType,
  WsAction,
  ClientState,
  ValidatorMap,
  WsRequest,
  WsResponse,
  WsSuccessResponse,
  WsFailureResponse,
  WsErrorResponse,
};
