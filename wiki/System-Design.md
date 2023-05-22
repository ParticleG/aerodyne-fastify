## `class` OicqClient

### Overview

```mermaid
classDiagram
    OicqClient ..> Protocol
    OicqClient ..> ClientState
    OicqClient "1" --o "N" Contact: contains
    note for OicqClient "ContactId = `${Contact.type}_${Contact.id}`"
    class OicqClient {
        +protocol: Protocol
        +account: number
        +state: ClientState
        -authorizedUserIds: Array~number~
        -contactMap: Map~ContactId，Contact~
    }
    class Protocol {
        <<enumeration>>
        Android
        aPad
        Watch
        iMac
        iPad
        old_Android
    }
    class ClientState {
        <<enumeration>>
        OFFLINE
        WAITING_QR
        WAITING_SLIDER
        WAITING_SMS
        ONLINE
    }

    Contact ..> Friend
    Contact ..> Group
    Contact ..> User
    class Contact {
        Friend | Group | User
    }

    Friend --|> User
    class Friend {
        +type: 'friend'
    }

    User ..> Gender
    class User {
        +type: 'user'
        +id: number
        +name: string
        +sex: Gender
        +avatar: string
        +updateInfo(): Promise~void~
        +getChatHistory(number? start, number? count) Promise~PrivateMessage[]~
        +markAsRead(number? start) Promise~void~
        +recallMessage(string messageId) Promise~boolean~
        +sendMessage(Message message) Promise~MessageRes~
    }
    
    class Gender {
        'male' | 'female' | 'unknown'
    }
```

### Login States

```mermaid
flowchart
    offline([Offline])
    qr[Waiting QR Code]
    slider[Waiting Slider]
    sms[Waiting SMS Code]
    online([Online])

    offline -->|With token| online
    offline -->|Without password| qr --> online
    offline -->|With password| slider --> online
    slider -->|New device| sms --> online
```