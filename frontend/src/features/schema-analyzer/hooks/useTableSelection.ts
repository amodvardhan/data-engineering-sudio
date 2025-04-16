// hooks/useTableSelection.ts
import { useState, useCallback, useEffect } from 'react';

export function useTableSelection(config: any, selectedDatabase: string) {
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTables = useCallback(async () => {
        if (!selectedDatabase) return;

        setLoading(true);
        setError(null);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(
                `${API_BASE_URL}/database/tables/${selectedDatabase}`,
                {
                    method: 'POST', // Verify backend expects POST
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config),
                }
            );

            if (!response.ok) throw new Error('Failed to fetch tables');

            const data = await response.json();
            setTables(data.tables); // Verify response structure
        } catch (err) {
            setError('Failed to fetch tables. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [config, selectedDatabase]);

    // Add useEffect to auto-fetch when database changes
    useEffect(() => {
        if (selectedDatabase) {
            fetchTables();
        }
    }, [selectedDatabase, fetchTables]);

    const toggleTable = (table: string) => {
        setSelectedTables(prev =>
            prev.includes(table)
                ? prev.filter(t => t !== table)
                : [...prev, table]
        );
    };

    return {
        tables,
        selectedTables,
        setSelectedTables,
        toggleTable,
        loading,
        error,
        fetchTables,
    };
}
