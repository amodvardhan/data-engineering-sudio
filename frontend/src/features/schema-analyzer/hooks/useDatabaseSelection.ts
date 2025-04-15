import { useState, useCallback } from 'react';

export function useDatabaseSelection(config: any, connected: boolean) {
    const [databases, setDatabases] = useState<string[]>([]);
    const [selectedDatabase, setSelectedDatabase] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Memoize fetchDatabases with useCallback
    const fetchDatabases = useCallback(async () => {
        if (!connected) return;

        setLoading(true);
        setError(null);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${API_BASE_URL}/database/databases/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            const data = await response.json();
            setDatabases(data.databases);
        } catch (err) {
            setError('Failed to fetch databases.');
        } finally {
            setLoading(false);
        }
    }, [config, connected]); // Add dependencies here

    return {
        databases,
        selectedDatabase,
        setSelectedDatabase,
        loading,
        error,
        fetchDatabases,
    };
}
