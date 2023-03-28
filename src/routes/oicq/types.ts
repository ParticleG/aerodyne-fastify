type UserId = number;
type OicqAccount = number;
type UUID = string;

enum WsAction {
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

interface WsMessage {
  action: WsAction;
  data: any;
}

class ErrorMessage {
  isFatal: boolean = false;
  message: string;
  action: WsAction | undefined;
  reasons: string[] | undefined;

  constructor(message?: string, action?: number, reasons?: string[]) {
    this.message = message ? message : "Unknown error";
    this.action = action;
    this.reasons = reasons;
  }

  toString() {
    return JSON.stringify({
      action: this.action,
      message: this.message,
      reasons: this.reasons,
    });
  }
}

export {
  UserId,
  OicqAccount,
  UUID,
  WsAction,
  ClientState,
  WsMessage,
  ErrorMessage,
};
