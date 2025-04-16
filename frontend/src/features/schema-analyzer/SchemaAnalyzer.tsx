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
        fetchHistory, fetchSingleHistory, handleDeleteHistory
    } = useChatHistory();

    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

    // Enhanced data loading
    useEffect(() => {
        if (connected) {
            fetchDatabases();
            fetchHistory();
            // const interval = setInterval(fetchHistory, 5000); // Refresh every 5 seconds
            // return () => clearInterval(interval);
        }
    }, [connected]);

    // Enhanced send handler
    const handleSend = async () => {
        if (!processing) {
            await sendPrompt();
            await fetchHistory(); // Immediate refresh after send
        }
    };

    const handleDeleteHistoryItem = async (id: string) => {
        try {
            await handleDeleteHistory(id);
            await fetchHistory(); // Refresh the list
            // Optionally show a success toast
        } catch (err) {
            // Optionally show an error toast
        }
    };


    // Handler for when a user clicks a history item
    const handleHistorySelect = async (id: string) => {
        try {
            setSelectedHistoryId(id);
            const data = await fetchSingleHistory(id);
            if (data) {
                setSelectedDatabase(data.database);
                setSelectedTables(data.tables);
                setMessages([
                    { role: 'user', content: data.prompt },
                    { role: 'assistant', content: data.response }
                ]);
            }
        } catch (err: any) {
            if (err.response?.status === 404) {
                // Refresh list to remove invalid items
                await fetchHistory();
                // showToast('This conversation is no longer available');
            }

        }

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
            {/* History Sidebar */}
            <ChatHistorySidebar
                history={history}
                loading={historyLoading}
                error={historyError}
                selectedId={selectedHistoryId}
                onSelect={handleHistorySelect}
                onDelete={handleDeleteHistoryItem}
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
                    onClick={() => {
                        setSelectedDatabase('');
                        setSelectedTables([]);
                        setMessages([]);
                    }}
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
