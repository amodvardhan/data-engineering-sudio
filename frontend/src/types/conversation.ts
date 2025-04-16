export interface MessageItem {
    id: string;
    prompt: string;
    response: string;
    timestamp: string;
}

export interface ConversationItem {
    id: string; // conversation_id
    database: string;
    tables: string[];
    messages: MessageItem[];
    last_updated: string;
}