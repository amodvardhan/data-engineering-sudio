// hooks/useChatHistory.ts
import { useState, useCallback } from 'react';
import axios from 'axios';

interface HistoryItem {
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
            setHistory(response.data.history);
            setError(null);
        } catch (err) {
            setError('Failed to load chat history');
            console.error('History fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const storeInteraction = useCallback(async (
        prompt: string,
        response: string,
        database: string,
        tables: string[]
    ) => {
        try {
            await axios.post(`${API_BASE_URL}/api/chat-history`, {
                prompt,
                response,
                database,
                tables
            });
            await fetchHistory(); // Refresh history list
        } catch (err) {
            console.error('Failed to store interaction:', err);
        }
    }, [fetchHistory]);

    return {
        history,
        loading,
        error,
        fetchHistory,
        storeInteraction
    };
}
