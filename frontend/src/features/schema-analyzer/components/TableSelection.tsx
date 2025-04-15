import { useState } from 'react';
import { Card, CardContent, TextField, InputAdornment, Chip, Paper, ListItem, Checkbox, ListItemText, Box, CircularProgress, Alert } from '@mui/material';
import { FixedSizeList as List } from 'react-window';
import SearchIcon from '@mui/icons-material/Search';

interface TableSelectionProps {
    tables: string[];
    selectedTables: string[];
    toggleTable: (table: string) => void;
    loading: boolean;
    error: string | null;
}

export default function TableSelection({ tables, selectedTables, toggleTable, loading, error }: TableSelectionProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const filteredTables = tables.filter(table =>
        table.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const TableRow = ({ index, style }: { index: number; style: React.CSSProperties }) => (
        <ListItem style={style} disablePadding>
            <Checkbox
                checked={selectedTables.includes(filteredTables[index])}
                onChange={() => toggleTable(filteredTables[index])}
            />
            <ListItemText primary={filteredTables[index]} />
        </ListItem>
    );

    return (
        <Card sx={{ mb: 4 }}>
            <CardContent>
                <Box display="flex" gap={2} mb={2}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search tables..."
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Chip
                        label={`${selectedTables.length} selected`}
                        color="primary"
                        variant="outlined"
                        sx={{ alignSelf: 'center' }}
                    />
                </Box>

                <Paper sx={{ height: 400, overflow: 'auto' }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <List
                            height={350}
                            itemCount={filteredTables.length}
                            itemSize={50}
                            width="100%"
                        >
                            {TableRow}
                        </List>
                    )}
                </Paper>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </CardContent>
        </Card>
    );
}
