import { useState, useCallback } from 'react';

export function useTableSelection(config: any, selectedDatabase: string) {
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Memoize fetchTables with useCallback
    const fetchTables = useCallback(async () => {
        if (!selectedDatabase) return;

        setLoading(true);
        setError(null);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(
                `${API_BASE_URL}/database/tables/${selectedDatabase}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...config, database_name: selectedDatabase }),
                }
            );
            const data = await response.json();
            setTables(data.tables);
        } catch (err) {
            setError('Failed to fetch tables.');
        } finally {
            setLoading(false);
        }
    }, [config, selectedDatabase]); // Add dependencies here

    const toggleTable = (table: string) => {
        setSelectedTables((prev) =>
            prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]
        );
    };

    return {
        tables,
        selectedTables,
        toggleTable,
        loading,
        error,
        fetchTables,
    };
}
