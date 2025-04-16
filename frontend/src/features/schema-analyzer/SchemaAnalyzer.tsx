import { useState, useEffect } from 'react';
import { Box, Card, CircularProgress, Alert, Button } from '@mui/material';
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
        history, loading: historyLoading, error: historyError,
        fetchHistory
    } = useChatHistory();

    // Load initial data
    useEffect(() => {
        if (connected) {
            fetchDatabases();
            fetchHistory();
        }
    }, [connected]);

    // Handle history selection
    const handleHistorySelect = async (id: string) => {
        try {
            const response = await fetch(`/api/chat-history/${id}`);
            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            setSelectedDatabase(data.database);
            setSelectedTables(data.tables);
            setMessages([
                { role: 'user', content: data.prompt },
                { role: 'assistant', content: data.response }
            ]);
        } catch (error) {
            console.error('History load failed:', error);
        }
    };

    // Reset state for new analysis
    const handleNewAnalysis = () => {
        setSelectedDatabase('');
        setSelectedTables([]);
        setMessages([]);
    };

    return (
        <Box sx={{
            display: 'flex',
            height: '90vh',
            gap: 2,
            p: 2,
            overflow: 'hidden',
            backgroundColor: 'background.default'
        }}>
            {/* History Sidebar */}
            <ChatHistorySidebar
                history={history}
                loading={historyLoading}
                error={historyError}
                onSelect={handleHistorySelect}
            />

            {/* Connection/Selection Panel */}
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

            {/* Analysis Chat */}
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
                        onSend={sendPrompt}
                        processing={processing}
                    />
                </Card>
            )}
        </Box>
    );
}
