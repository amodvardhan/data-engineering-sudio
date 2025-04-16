// src/components/ChatHistorySidebar.tsx
import { List, ListItemButton, ListItemText, Box, Typography, CircularProgress, Alert, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { HistoryItem } from '../hooks/useChatHistory';

interface ChatHistorySidebarProps {
    history: HistoryItem[];
    loading: boolean;
    error: string | null;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}


export default function ChatHistorySidebar({
    history,
    loading,
    error,
    selectedId,
    onSelect,
    onDelete
}: ChatHistorySidebarProps) {
    return (
        <Box sx={{ width: 300, height: '100vh', overflow: 'hidden', borderRight: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ p: 2 }}>Chat History</Typography>
            <Box sx={{ height: 'calc(100% - 64px)', overflowY: 'auto' }}>
                {error ? (
                    <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                ) : loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <List disablePadding>
                        {Array.isArray(history) && history.length > 0 ? (
                            history.map((item) => (
                                <ListItemButton
                                    key={item.id}
                                    selected={selectedId === item.id}
                                    onClick={() => onSelect(item.id)}
                                    sx={{ '&.Mui-selected': { bgcolor: 'action.selected' } }}
                                >
                                    <ListItemText
                                        primary={item.prompt.substring(0, 40) + (item.prompt.length > 40 ? '...' : '')}
                                        secondary={
                                            <>
                                                <Typography variant="caption" display="block">
                                                    {new Date(item.timestamp).toLocaleString()}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.database} › {Array.isArray(item.tables) ? item.tables.join(', ') : item.tables}
                                                </Typography>
                                            </>
                                        }
                                        primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={e => {
                                            e.stopPropagation(); // Prevent selecting the item
                                            onDelete(item.id);
                                        }}
                                        size="small"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </ListItemButton>

                            ))
                        ) : (
                            <Typography variant="body2" sx={{ p: 2, color: 'text.secondary' }}>
                                No chat history available.
                            </Typography>
                        )}
                    </List>
                )}
            </Box>
        </Box>
    );
}
