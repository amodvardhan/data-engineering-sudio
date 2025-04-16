import { CardContent, Typography, Paper, Box, TextField, IconButton, CircularProgress } from '@mui/material';
import { Send } from '@mui/icons-material';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useMemo } from 'react';
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
    const codeBlockStyles = useMemo(() => materialLight, []);
    return (
        <CardContent sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            p: 0
        }}>
            {/* Message History with Scroll */}
            <Box sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                '& > *': {
                    maxWidth: '80%',
                    alignSelf: 'flex-start'
                }
            }}>
                {messages.map((msg, idx) => (
                    <Box
                        key={idx}
                        sx={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            width: 'fit-content'
                        }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: 4,
                                bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                                color: msg.role === 'user' ? 'common.white' : 'text.primary',
                            }}
                        >
                            <Typography variant="body1" component="div">
                                {msg.status === 'processing' ? (
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <CircularProgress size={16} />
                                        Analyzing...
                                    </Box>
                                ) : (
                                    <Markdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return match ? (
                                                    <SyntaxHighlighter
                                                        style={codeBlockStyles}
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
                            </Typography>
                        </Paper>
                    </Box>
                ))}
            </Box>

            {/* Input Area */}
            <Box sx={{
                p: 2,
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper'
            }}>
                <Box display="flex" gap={1} alignItems="center">
                    <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={currentPrompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        placeholder="Type your analysis request..."
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
                        multiline
                        maxRows={4}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 4,
                            }
                        }}
                    />
                    <IconButton
                        color="primary"
                        onClick={onSend}
                        disabled={!currentPrompt.trim() || processing}
                        sx={{
                            height: 40,
                            width: 40,
                            backgroundColor: 'primary.main',
                            '&:hover': {
                                backgroundColor: 'primary.dark'
                            }
                        }}
                    >
                        {processing ? (
                            <CircularProgress size={20} sx={{ color: 'common.white' }} />
                        ) : (
                            <Send sx={{ color: 'common.white', fontSize: 20 }} />
                        )}
                    </IconButton>
                </Box>
            </Box>
        </CardContent>
    );
}
