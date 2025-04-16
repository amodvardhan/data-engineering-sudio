// components/ChatHistorySidebar.tsx
import { List, ListItemButton, ListItemText, Box, Typography } from '@mui/material';

interface HistoryItem {
    id: string;
    prompt: string;
    timestamp: string;
}

interface ChatHistorySidebarProps {
    history: HistoryItem[];
    onSelect: (id: string) => void;
    loading: boolean;
    error: string | null;
}

export default function ChatHistorySidebar({ history, onSelect }: ChatHistorySidebarProps) {
    return (
        <Box sx={{
            width: 300,
            borderRight: 1,
            borderColor: 'divider',
            height: '100vh',
            overflowY: 'auto'
        }}>
            <Typography variant="h6" sx={{ p: 2 }}>
                Analysis History
            </Typography>

            <List disablePadding>
                {history.map((item) => (
                    <ListItemButton
                        key={item.id}
                        onClick={() => onSelect(item.id)}
                        sx={{
                            '&.Mui-selected': {
                                bgcolor: 'action.selected',
                            }
                        }}
                    >
                        <ListItemText
                            primary={item.prompt.substring(0, 40) + '...'}
                            secondary={new Date(item.timestamp).toLocaleString()}
                            primaryTypographyProps={{ variant: 'body2' }}
                        />
                    </ListItemButton>
                ))}
            </List>
        </Box>
    );
}
