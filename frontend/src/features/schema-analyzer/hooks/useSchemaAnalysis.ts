import { useState } from 'react';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    status?: 'processing' | 'complete';
}

export function useSchemaAnalysis(
    config: any,
    selectedDatabase: string,
    selectedTables: string[]
) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [processing, setProcessing] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const simulateProcessingSteps = async () => {
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Starting analysis...',
            status: 'processing'
        }]);

        // Simulate processing steps
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMessages(prev => [
            ...prev.slice(0, -1),
            {
                role: 'assistant',
                content: '🔍 Identifying table relationships...',
                status: 'processing'
            }
        ]);

        await new Promise(resolve => setTimeout(resolve, 1500));
        setMessages(prev => [
            ...prev.slice(0, -1),
            {
                role: 'assistant',
                content: '📊 Generating schema recommendations...',
                status: 'processing'
            }
        ]);
    };

    const sendPrompt = async () => {
        if (!currentPrompt.trim()) return;

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: currentPrompt }]);
        setCurrentPrompt('');
        setProcessing(true);

        try {
            await simulateProcessingSteps();

            const response = await fetch(`${API_BASE_URL}/database/analyze-schema/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...config,
                    database_name: selectedDatabase,
                    prompt: currentPrompt,
                    selected_tables: selectedTables,
                }),
            });

            const data = await response.json();

            setMessages(prev => [
                ...prev.filter(m => m.status !== 'processing'),
                {
                    role: 'assistant',
                    content: data.analysis || 'No response from LLM.',
                    status: 'complete'
                }
            ]);
        } catch (error) {
            setMessages(prev => [
                ...prev.filter(m => m.status !== 'processing'),
                {
                    role: 'assistant',
                    content: '❌ **Error:** Failed to analyze schema. Please try again.',
                    status: 'complete'
                }
            ]);
        } finally {
            setProcessing(false);
        }
    };

    return {
        messages,
        setMessages,
        currentPrompt,
        setCurrentPrompt,
        processing,
        sendPrompt,
    };
}
