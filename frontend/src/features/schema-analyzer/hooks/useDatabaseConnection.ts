import { useState } from 'react';

export function useDatabaseConnection() {
    const [config, setConfig] = useState(() => {
        const cached = localStorage.getItem('dbConfig');
        return cached
            ? JSON.parse(cached)
            : { host: 'localhost', username: '', password: '', databaseType: 'postgres' };
    });
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connect = async () => {
        setLoading(true);
        setError(null);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${API_BASE_URL}/database/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            const data = await response.json();
            if (data.message) {
                localStorage.setItem('dbConfig', JSON.stringify(config));
                setConnected(true);
            } else {
                setError('Connection failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Connection failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return { config, setConfig, connected, setConnected, loading, error, connect };
}
