// src/hooks/useChatHistory.ts
import { useState, useCallback } from 'react';
import axios from 'axios';
import { ConversationItem } from '../../../types/conversation';

export function useChatHistory() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [currentConversation, setCurrentConversation] = useState<ConversationItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get<ConversationItem[]>(`${API_BASE_URL}/api/chat-history`);
            setConversations(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load chat history');
            setConversations([]);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    const fetchConversation = useCallback(async (conversationId: string) => {
        setLoading(true);
        try {
            const response = await axios.get<ConversationItem>(
                `${API_BASE_URL}/api/chat-history/${conversationId}`
            );
            setError(null);
            return response.data; // Return the fetched conversation
        } catch (err) {
            setError('Failed to load conversation');
            return null; // Explicitly return null on error
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);


    const deleteConversation = useCallback(async (conversationId: string) => {
        setLoading(true);
        try {
            // Optimistic update: remove from local state first
            setConversations(prev => prev.filter(c => c.id !== conversationId));

            // Then send delete request
            await axios.delete(`${API_BASE_URL}/api/chat-history/${conversationId}`);

            setError(null);
        } catch (err) {
            // Rollback on error
            setConversations(prev => [...prev]);
            setError('Failed to delete conversation');
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);


    return {
        conversations,
        currentConversation,
        loading,
        error,
        fetchHistory,
        fetchConversation,
        deleteConversation,
    };
}
