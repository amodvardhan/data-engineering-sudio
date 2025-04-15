import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Paper, Box, TextField, IconButton, CircularProgress, Alert } from '@mui/material';
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
    const [localMessages, setLocalMessages] = useState<Message[]>([]);

    useEffect(() => {
        setLocalMessages(messages);
    }, [messages]);

    return (
        <Card sx={{ mt: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>Schema Analysis</Typography>

                <Paper sx={{ height: 400, overflow: 'auto', mb: 2, p: 2, bgcolor: 'background.default' }}>
                    {localMessages.map((message, index) => (
                        <Box
                            key={index}
                            sx={{
                                mb: 2,
                                textAlign: message.role === 'user' ? 'right' : 'left'
                            }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    display: 'inline-block',
                                    p: 2,
                                    borderRadius: 4,
                                    bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                                    color: message.role === 'user' ? 'common.white' : 'text.primary',
                                    maxWidth: '80%',
                                    ml: message.role === 'assistant' ? 0 : 'auto'
                                }}
                            >
                                {message.status === 'processing' ? (
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
                                        {message.content}
                                    </Markdown>
                                )}
                            </Paper>
                        </Box>
                    ))}
                </Paper>

                <Box display="flex" gap={1} alignItems="flex-end">
                    <TextField
                        fullWidth
                        variant="outlined"
                        value={currentPrompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        placeholder="Ask me about the schema..."
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
                        multiline
                        maxRows={4}
                    />
                    <IconButton
                        color="primary"
                        onClick={onSend}
                        disabled={!currentPrompt.trim() || processing}
                        sx={{ height: 56 }}
                    >
                        {processing ? <CircularProgress size={24} /> : <Send />}
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
}
