import { useState, useEffect } from 'react';
import { Box, Card, Button } from '@mui/material';
import { useDatabaseConnection } from './hooks/useDatabaseConnection';
import { useDatabaseSelection } from './hooks/useDatabaseSelection';
import { useTableSelection } from './hooks/useTableSelection';
import { useSchemaAnalysis } from './hooks/useSchemaAnalysis';
import { useChatHistory } from './hooks/useChatHistory';
import ConnectionForm from './components/ConnectionForm';
import DatabaseSelection from './components/DatabaseSelection';
import TableSelection from './components/TableSelection';
import AnalysisChat from './components/AnalysisChat';
import ChatHistorySidebar from './components/ChatHistorySidebar';
import { ConversationItem } from '../../types/conversation';

export default function SchemaAnalyzer() {
    const {
        config, setConfig, connected, loading: connLoading,
        error: connError, connect
    } = useDatabaseConnection();

    const {
        databases, selectedDatabase, setSelectedDatabase,
        loading: dbLoading, error: dbError, fetchDatabases
    } = useDatabaseSelection(config, connected);

    const {
        tables, selectedTables, setSelectedTables, toggleTable,
        loading: tblLoading, error: tblError, fetchTables
    } = useTableSelection(config, selectedDatabase);

    const {
        messages, setMessages, currentPrompt, setCurrentPrompt,
        processing, sendPrompt
    } = useSchemaAnalysis(config, selectedDatabase, selectedTables);

    const {
        conversations,
        loading: historyLoading,
        error: historyError,
        fetchHistory,
        fetchConversation,
        deleteConversation
    } = useChatHistory();

    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

    useEffect(() => {
        if (connected) {
            fetchDatabases();
            fetchHistory();
        }
    }, [connected, fetchDatabases, fetchHistory]);

    const handleSend = async () => {
        if (!processing) {
            await sendPrompt();
            await fetchHistory();
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteConversation(id);
            if (selectedConversationId === id) {
                setSelectedConversationId(null);
                setMessages([]);
            }
            fetchHistory();
            // Removed the fetchHistory() call here
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };


    const handleSelectConversation = async (id: string) => {
        try {
            const conv = await fetchConversation(id);
            if (!conv) {
                throw new Error('Conversation not found');
            }

            setSelectedConversationId(id);
            setSelectedDatabase(conv.database);
            setSelectedTables(conv.tables);

            // Convert conversation messages to chat format
            const msgs = conv.messages.flatMap(msg => [
                { role: 'user' as const, content: msg.prompt },
                { role: 'assistant' as const, content: msg.response }
            ]);

            setMessages(msgs);
        } catch (err) {
            console.error('Failed to load conversation:', err);
            await fetchHistory(); // Refresh list to remove invalid entries
        }
    };


    const handleNewAnalysis = () => {
        setSelectedDatabase('');
        setSelectedTables([]);
        setMessages([]);
        setSelectedConversationId(null);
    };

    return (
        <Box sx={{
            display: 'flex',
            height: '100vh',
            gap: 2,
            p: 2,
            overflow: 'hidden',
            backgroundColor: 'background.default'
        }}>
            {/* Sidebar */}
            <ChatHistorySidebar
                conversations={conversations}
                loading={historyLoading}
                error={historyError}
                selectedId={selectedConversationId}
                onSelect={handleSelectConversation}
                onDelete={handleDelete}
            />

            {/* Main Content */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                width: 400,
                flexShrink: 0,
                gap: 2,
                height: '100%',
                minHeight: 0
            }}>
                <Button
                    variant="contained"
                    onClick={handleNewAnalysis}
                    disabled={!selectedDatabase}
                    sx={{ mb: 2 }}
                >
                    New Analysis
                </Button>

                {!connected ? (
                    <Card sx={{ flex: 1, p: 2 }}>
                        <ConnectionForm
                            config={config}
                            setConfig={setConfig}
                            loading={connLoading}
                            error={connError}
                            onConnect={connect}
                        />
                    </Card>
                ) : (
                    <>
                        <Card sx={{ flex: 1, p: 2 }}>
                            <DatabaseSelection
                                databases={databases}
                                loading={dbLoading}
                                error={dbError}
                                onSelect={setSelectedDatabase}
                                selectedDatabase={selectedDatabase}
                            />
                        </Card>
                        <Card sx={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                            <TableSelection
                                tables={tables}
                                selectedTables={selectedTables}
                                toggleTable={toggleTable}
                                loading={tblLoading}
                                error={tblError}
                                databaseSelected={!!selectedDatabase}
                            />
                        </Card>
                    </>
                )}
            </Box>

            {/* Chat Window */}
            {selectedTables.length > 0 && (
                <Card sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '60vw',
                    minHeight: 0,
                    height: '100%'
                }}>
                    <AnalysisChat
                        messages={messages}
                        currentPrompt={currentPrompt}
                        onPromptChange={setCurrentPrompt}
                        onSend={handleSend}
                        processing={processing}
                    />
                </Card>
            )}
        </Box>
    );
}
