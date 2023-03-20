enum WsAction {
    Login,
    Validate,
    Message,
}

type ValidateType = 'qrcode' | 'sms' | 'slider';

interface WsMessage {
    action: WsAction;
    data: any;
}

class LoginMessage implements WsMessage {
    action: WsAction = WsAction.Login;
    data: {
        account: number;
        password: string | undefined;
    } | undefined;

    constructor(parsed: any) {
        this.data = {
            account: parsed.account,
            password: parsed.password
        };
    }
}

class ValidateMessage implements WsMessage {
    action: WsAction = WsAction.Validate;
    data: {
        type: ValidateType;
        payload: string | undefined;
    };

    constructor(parsed: any) {
        this.data = {
            type: parsed.type,
            payload: parsed.payload
        };
    }
}

class MessageMessage implements WsMessage {
    action: WsAction = WsAction.Message;
    data: {
        sender: number;
        message: string;
    } | undefined;

    constructor(parsed: any) {
        this.data = {
            sender: parsed.sender,
            message: parsed.message
        };
    }
}

function parseJsonMessage(message: string): WsMessage | undefined {
    try {
        const parsed = JSON.parse(message);
        switch (parsed.action) {
            case WsAction.Login:
                return new LoginMessage(parsed);
            case WsAction.Validate:
                return new ValidateMessage(parsed);
            case WsAction.Message:
                return new MessageMessage(parsed);
        }
    } catch (e: any) {
        console.warn(e.message);
    }
}

export {parseJsonMessage};