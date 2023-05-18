import { OicqAccount, WsAction } from 'src/types/common';

type WsResult = 'success' | 'failure' | 'error';

export interface WsRequest {
  action: WsAction;
  account?: OicqAccount;
  data?: any;
}

export interface MonitorRequest extends WsRequest {
  action: WsAction.Monitor;
  account: undefined;
  data: undefined;
}

export interface ListRequest extends WsRequest {
  action: WsAction.List;
  account: undefined;
  data: undefined;
}

export interface SubscribeRequest extends WsRequest {
  action: WsAction.Subscribe;
  account: OicqAccount;
  data: undefined;
}

export interface LoginRequest extends WsRequest {
  action: WsAction.Login;
  account: OicqAccount;
  data?: string;
}

export interface LogoutRequest extends WsRequest {
  action: WsAction.Logout;
  account: OicqAccount;
  data: undefined;
}

export interface MessageRequest extends WsRequest {
  action: WsAction.Message;
  account: OicqAccount;
  data: {
    message: string;
  };
}

export interface ClientInfoRequest extends WsRequest {
  action: WsAction.ClientInfo;
  account: OicqAccount;
  data: undefined;
}

export interface HistoryRequest extends WsRequest {
  action: WsAction.ClientInfo;
  account: OicqAccount;
  data: {
    id: number;
    type: 'group' | 'user';
    start?: number;
    count?: number;
  };
}

export class WsResponse implements WsRequest {
  result: WsResult;
  action: WsAction;
  account?: OicqAccount;
  data: any;

  constructor(
    result: WsResult,
    action?: WsAction,
    account?: OicqAccount,
    data?: any
  ) {
    if (action === undefined || !Object.values(WsAction).includes(action)) {
      this.action = WsAction.Invalid;
      this.result = 'error';
    } else {
      this.action = action;
      this.result = result;
    }
    this.account = account;
    this.data = data;
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

export class WsErrorResponse extends WsResponse {
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
    super('error', action, account);
    this.data = {
      message: message || 'Unknown error',
      reasons: reasons,
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

export class WsSuccessResponse extends WsResponse {
  constructor(action: WsAction, account?: OicqAccount, data?: any) {
    super('success', action, account, data);
  }

  static fromRequest(request: WsRequest, account?: OicqAccount, data?: any) {
    return new this(request.action, account, data);
  }
}
