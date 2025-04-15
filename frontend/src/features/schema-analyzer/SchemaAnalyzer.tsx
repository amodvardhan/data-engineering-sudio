import { Box, Card } from '@mui/material';
import { useDatabaseConnection } from './hooks/useDatabaseConnection';
import { useDatabaseSelection } from './hooks/useDatabaseSelection';
import { useTableSelection } from './hooks/useTableSelection';
import { useSchemaAnalysis } from './hooks/useSchemaAnalysis';
import ConnectionForm from './components/ConnectionForm';
import DatabaseSelection from './components/DatabaseSelection';
import TableSelection from './components/TableSelection';
import AnalysisChat from './components/AnalysisChat';
import { useEffect } from 'react';

export default function SchemaAnalyzer() {
    const {
        config, setConfig, connected, loading: connLoading, error: connError, connect
    } = useDatabaseConnection();

    // Add fetchDatabases here
    const {
        databases, selectedDatabase, setSelectedDatabase, loading: dbLoading, error: dbError, fetchDatabases
    } = useDatabaseSelection(config, connected);

    const {
        tables, selectedTables, toggleTable, loading: tblLoading, error: tblError, fetchTables
    } = useTableSelection(config, selectedDatabase);

    const {
        messages, currentPrompt, setCurrentPrompt, processing, sendPrompt
    } = useSchemaAnalysis(config, selectedDatabase, selectedTables);

    useEffect(() => {
        if (connected) {
            fetchDatabases();
        }
    }, [connected, fetchDatabases]); // fetchDatabases is now memoized

    // Optimized useEffect for tables
    useEffect(() => {
        if (selectedDatabase) {
            fetchTables();
        }
    }, [selectedDatabase, fetchTables]); // fetchTables is now memoized

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 64px)',
            p: 3,
            gap: 2
        }}>
            {!connected && (
                <Card>
                    <ConnectionForm
                        config={config}
                        setConfig={setConfig}
                        loading={connLoading}
                        error={connError}
                        onConnect={connect}
                    />
                </Card>
            )}

            {connected && !selectedDatabase && (
                <DatabaseSelection
                    databases={databases}
                    loading={dbLoading}
                    error={dbError}
                    onSelect={setSelectedDatabase}
                />
            )}

            {selectedDatabase && tables.length > 0 && (
                <TableSelection
                    tables={tables}
                    selectedTables={selectedTables}
                    toggleTable={toggleTable}
                    loading={tblLoading}
                    error={tblError}
                />
            )}

            {selectedTables.length > 0 && (
                <AnalysisChat
                    messages={messages}
                    currentPrompt={currentPrompt}
                    onPromptChange={setCurrentPrompt}
                    onSend={sendPrompt}
                    processing={processing}
                />
            )}
        </Box>
    );
}
function fetchDatabases() {
    throw new Error('Function not implemented.');
}

function fetchTables() {
    throw new Error('Function not implemented.');
}

