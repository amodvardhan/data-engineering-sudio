// src/components/ChatHistorySidebar.tsx
import { List, ListItemButton, ListItemText, Box, Typography, CircularProgress, Alert, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { ConversationItem } from '../../../types/conversation';

interface ChatHistorySidebarProps {
    conversations: ConversationItem[];
    loading: boolean;
    error: string | null;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function ChatHistorySidebar({
    conversations,
    loading,
    error,
    selectedId,
    onSelect,
    onDelete
}: ChatHistorySidebarProps) {
    return (
        <Box sx={{ width: 300, height: '100vh', overflow: 'hidden', borderRight: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ p: 2 }}>Conversation History</Typography>
            <Box sx={{ height: 'calc(100% - 64px)', overflowY: 'auto' }}>
                {error ? (
                    <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                ) : loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <List disablePadding>
                        {conversations.length > 0 ? (
                            conversations.map((conv) => (
                                <ListItemButton
                                    key={conv.id}
                                    selected={selectedId === conv.id}
                                    onClick={() => onSelect(conv.id)}
                                    sx={{ '&.Mui-selected': { bgcolor: 'action.selected' } }}
                                >
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2">
                                                {conv.database} › {conv.tables.join(', ')}
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="caption" display="block">
                                                    {new Date(conv.last_updated).toLocaleString()}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {conv.messages.length} messages
                                                </Typography>
                                            </>
                                        }
                                        primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(conv.id);
                                        }}
                                        size="small"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </ListItemButton>
                            ))
                        ) : (
                            <Typography variant="body2" sx={{ p: 2, color: 'text.secondary' }}>No conversations available.</Typography>
                        )}
                    </List>
                )}
            </Box>
        </Box>
    );
}
