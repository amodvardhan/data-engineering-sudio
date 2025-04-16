import { useState } from 'react';
import {
    CardContent, TextField, InputAdornment, Chip,
    Paper, ListItem, Checkbox, ListItemText, Box, Alert,
    CircularProgress,
    Typography
} from '@mui/material';
import { FixedSizeList as List } from 'react-window';
import SearchIcon from '@mui/icons-material/Search';

interface TableSelectionProps {
    tables: string[];
    selectedTables: string[];
    toggleTable: (table: string) => void;
    loading: boolean;
    error: string | null;
    databaseSelected: boolean
}

export default function TableSelection({
    tables, selectedTables, toggleTable, loading, error, databaseSelected
}: TableSelectionProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const filteredTables = tables.filter(table =>
        table.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const TableRow = ({ index, style }: { index: number; style: React.CSSProperties }) => (
        <ListItem style={style} disablePadding>
            <Checkbox
                checked={selectedTables.includes(filteredTables[index])}
                onChange={() => toggleTable(filteredTables[index])}
                sx={{ p: 1 }}
            />
            <ListItemText
                primary={filteredTables[index]}
                primaryTypographyProps={{ variant: 'body2' }}
            />
        </ListItem>
    );

    return (
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {!databaseSelected ? (
                <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 8 }}>
                    <Typography variant="body2">Select a database to view tables.</Typography>
                </Box>
            ) : (
                <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="Search tables..."
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Chip
                        label={`${selectedTables.length} selected`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Box>
            )}
            <Paper sx={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <List
                        height={400}
                        itemCount={filteredTables.length}
                        itemSize={40}
                        width="100%"
                    >
                        {TableRow}
                    </List>
                )}
            </Paper>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        </CardContent>
    );
}
