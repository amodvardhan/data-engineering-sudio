// src/hooks/useChatHistory.ts
import { useState, useCallback } from 'react';
import axios from 'axios';

export interface HistoryItem {
    id: string;
    prompt: string;
    response: string;
    database: string;
    tables: string[];
    timestamp: string;
}

export function useChatHistory() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/chat-history`);
            // Handles both {history: [...]} and [...] as response
            const data = Array.isArray(response.data)
                ? response.data
                : (response.data.history || []);
            setHistory(data);
            setError(null);
        } catch (err) {
            setError('Failed to load chat history');
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSingleHistory = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/chat-history/${id}`);
            setError(null);
            return response.data as HistoryItem;
        } catch (err) {
            setError('Failed to load history item');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        history,
        loading,
        error,
        fetchHistory,
        fetchSingleHistory,
    };
}
