import {
    Box,
    TextField,
    IconButton,
    CircularProgress,
    Paper,
    Typography,
    Alert
} from '@mui/material';
import { Send } from '@mui/icons-material';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    status?: 'processing' | 'complete';
}

interface ChatWindowProps {
    messages: Message[];
    currentPrompt: string;
    onPromptChange: (value: string) => void;
    onSend: () => void;
    processing: boolean;
    error?: string | null;
    historyPrompt?: string | null;
    historyResponse?: string | null;
}

export default function ChatWindow({
    messages,
    currentPrompt,
    onPromptChange,
    onSend,
    processing,
    error,
    historyPrompt,
    historyResponse
}: ChatWindowProps) {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden'
        }}>
            <Box sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                bgcolor: 'background.default'
            }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {historyPrompt && historyResponse ? (
                    <Paper sx={{ p: 3, mb: 2, bgcolor: 'background.paper' }}>
                        <Typography variant="h6" gutterBottom>
                            Historical Conversation
                        </Typography>
                        <Typography variant="body1" paragraph>
                            <strong>You:</strong> {historyPrompt}
                        </Typography>
                        <Typography variant="body1">
                            <strong>Assistant:</strong> {historyResponse}
                        </Typography>
                    </Paper>
                ) : (
                    messages.map((msg, index) => (
                        <Box
                            key={index}
                            sx={{
                                mb: 2,
                                textAlign: msg.role === 'user' ? 'right' : 'left'
                            }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    display: 'inline-block',
                                    p: 2,
                                    borderRadius: 4,
                                    bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                                    color: msg.role === 'user' ? 'common.white' : 'text.primary',
                                    maxWidth: '80%',
                                    ml: msg.role === 'assistant' ? 0 : 'auto',
                                    wordBreak: 'break-word'
                                }}
                            >
                                {msg.status === 'processing' ? (
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <CircularProgress size={16} />
                                        <Typography variant="body2">Processing...</Typography>
                                    </Box>
                                ) : (
                                    <Markdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return match ? (
                                                    <SyntaxHighlighter
                                                        style={materialLight}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        {...props}
                                                    >
                                                        {String(children).replace(/\n$/, '')}
                                                    </SyntaxHighlighter>
                                                ) : (
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            }
                                        }}
                                    >
                                        {msg.content}
                                    </Markdown>
                                )}
                            </Paper>
                        </Box>
                    ))
                )}
            </Box>

            {!historyPrompt && !historyResponse && (
                <Box sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                }}>
                    <Box display="flex" gap={1} alignItems="flex-end">
                        <TextField
                            fullWidth
                            variant="outlined"
                            value={currentPrompt}
                            onChange={(e) => onPromptChange(e.target.value)}
                            placeholder="Type your schema analysis request..."
                            multiline
                            maxRows={4}
                            disabled={processing}
                            onKeyPress={handleKeyPress}
                            inputProps={{
                                'aria-label': 'Chat input',
                                'data-testid': 'chat-input'
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 4,
                                    '&:hover fieldset': {
                                        borderColor: 'primary.main'
                                    }
                                }
                            }}
                        />
                        <IconButton
                            color="primary"
                            onClick={onSend}
                            disabled={!currentPrompt.trim() || processing}
                            sx={{
                                height: 56,
                                width: 56,
                                flexShrink: 0,
                                bgcolor: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'primary.dark'
                                },
                                '&:disabled': {
                                    bgcolor: 'action.disabledBackground'
                                }
                            }}
                            aria-label="Send message"
                        >
                            {processing ? (
                                <CircularProgress size={24} sx={{ color: 'common.white' }} />
                            ) : (
                                <Send sx={{ color: 'common.white', fontSize: 24 }} />
                            )}
                        </IconButton>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
