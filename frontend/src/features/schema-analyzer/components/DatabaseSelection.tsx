import { CardContent, List, ListItem, Button, CircularProgress, Alert, Typography } from '@mui/material';

interface DatabaseSelectionProps {
    databases: string[];
    loading: boolean;
    error: string | null;
    onSelect: (db: string) => void;
    selectedDatabase: string;
}

export default function DatabaseSelection({
    databases, loading, error, onSelect, selectedDatabase
}: DatabaseSelectionProps) {
    return (
        <CardContent>
            <Typography variant="subtitle1" gutterBottom>Databases</Typography>
            {loading && <CircularProgress size={24} sx={{ mb: 2 }} />}
            <List dense sx={{ overflow: 'auto', maxHeight: 300 }}>
                {databases.map((db) => (
                    <ListItem key={db} disablePadding>
                        <Button
                            fullWidth
                            onClick={() => onSelect(db)}
                            sx={{
                                justifyContent: 'flex-start',
                                textTransform: 'none',
                                fontWeight: db === selectedDatabase ? 600 : 400,
                                bgcolor: db === selectedDatabase ? 'action.selected' : 'inherit'
                            }}
                        >
                            {db}
                        </Button>
                    </ListItem>
                ))}
            </List>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
    );
}
