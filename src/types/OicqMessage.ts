import { DiscussMessage, GroupMessage, PrivateMessage } from "icqq";

interface OicqGroupMessage {
  type: 'group';
  subtype: "normal" | "anonymous"
}

interface OicqPrivateMessage {
  type: 'private';
  subtype: "group" | "friend" | "other" | "self"
}

class OicqMessage implements OicqGroupMessage, OicqPrivateMessage{
  constructor(message: DiscussMessage | GroupMessage | PrivateMessage) {
    switch (message.message_type){
      case:
    }
  }
}