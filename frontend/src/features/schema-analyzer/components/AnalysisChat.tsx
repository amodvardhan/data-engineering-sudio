import {
    Card,
    CardContent,
    Typography,
    Paper,
    Box,
    TextField,
    IconButton,
    CircularProgress
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

interface AnalysisChatProps {
    messages: Message[];
    currentPrompt: string;
    onPromptChange: (value: string) => void;
    onSend: () => void;
    processing: boolean;
}

export default function AnalysisChat({
    messages,
    currentPrompt,
    onPromptChange,
    onSend,
    processing
}: AnalysisChatProps) {
    return (
        <Card sx={{ mt: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>Schema Analysis</Typography>

                {/* Message History */}
                <Paper sx={{
                    height: 400,
                    overflow: 'auto',
                    mb: 2,
                    p: 2,
                    background: (theme) => theme.palette.mode === 'dark' ? '#1E1E1E' : '#F8F9FA'
                }}>
                    {messages.map((msg, idx) => (
                        <Box
                            key={idx}
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
                                    ml: msg.role === 'assistant' ? 0 : 'auto'
                                }}
                            >
                                {msg.status === 'processing' ? (
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <CircularProgress size={16} />
                                        <Typography variant="body2">Analyzing...</Typography>
                                    </Box>
                                ) : (
                                    <Markdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return match ? (
                                                    <SyntaxHighlighter
                                                        style={materialLight as { [key: string]: React.CSSProperties }}
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
                    ))}
                </Paper>

                {/* Input Area */}
                <Box display="flex" gap={1} alignItems="flex-end">
                    <TextField
                        fullWidth
                        variant="outlined"
                        value={currentPrompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        placeholder="Type your analysis request..."
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
                        multiline
                        maxRows={4}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 4,
                                backgroundColor: 'background.paper'
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
                            backgroundColor: 'primary.main',
                            '&:hover': {
                                backgroundColor: 'primary.dark'
                            }
                        }}
                    >
                        {processing ? (
                            <CircularProgress size={24} sx={{ color: 'common.white' }} />
                        ) : (
                            <Send sx={{ color: 'common.white' }} />
                        )}
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
}
