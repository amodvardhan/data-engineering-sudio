import { Card, CardContent, Typography, List, ListItem, Button, CircularProgress, Alert } from '@mui/material';

export default function DatabaseSelection({ databases, loading, error, onSelect }: any) {
    return (
        <Card sx={{ mb: 4 }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Select Database</Typography>
                {loading && <CircularProgress />}
                <List>
                    {databases.map((db: string) => (
                        <ListItem key={db} disablePadding>
                            <Button
                                fullWidth
                                onClick={() => onSelect(db)}
                                sx={{ justifyContent: 'flex-start' }}
                            >
                                {db}
                            </Button>
                        </ListItem>
                    ))}
                </List>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </CardContent>
        </Card>
    );
}
