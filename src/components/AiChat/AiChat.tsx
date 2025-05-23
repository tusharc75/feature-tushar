import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Fab, Dialog, DialogTitle, DialogContent, IconButton, Avatar,
  Typography, Box, TextField, Tooltip, useTheme, Paper, Button, CircularProgress
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Send as SendIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import genieImage from 'src/assets/dashboard_images/sidebar/genie.svg';
import Draggable from 'react-draggable';
import axiosInstance from 'src/axios/axiosInstance';
import { backendApi } from 'src/config';
import remarkGfm from 'remark-gfm';
import Markdown from 'react-markdown';

interface AiChatComponentProps {
  editorRef?: React.MutableRefObject<any>;
}

interface ChatResponse {
  prompt: string;
  content: string;
  isLoading?: boolean;
}

const AiChatComponent: React.FC<AiChatComponentProps> = ({ editorRef }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [responses, setResponses] = useState<ChatResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const textFieldRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [responses]);

  const PaperComponent = useMemo(() => (props: any) => (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
      bounds="parent"
    >
      <Paper {...props} sx={{
        width: '450px',
        height: '600px',
        borderRadius: '8px',
        backgroundColor: theme.palette.background.paper,
        boxShadow: '0px 8px 28px rgba(0, 0, 0, 0.28)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${theme.palette.divider}`,
      }} />
    </Draggable>
  ), [theme]);

  const handleSubmit = async (customPrompt: string | null = null) => {
    const currentPrompt = customPrompt || prompt;
    if (!currentPrompt.trim()) return;

    setIsLoading(true);
    setResponses(prev => [...prev, { prompt: currentPrompt, content: '', isLoading: true }]);

    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const entityId = localStorage.getItem('selectedEntity');
      if (entityId) {
        headers['entity'] = entityId;
      }

      const response = await fetch(`${backendApi}/generative-ai/assistant/ask`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: currentPrompt }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Network response was not ok.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullResponse = '';
      let buffer = '';
      let isStreaming = false;

      const processBuffer = () => {
        if (buffer.length === 0) {
          isStreaming = false;
          return;
        }

        const charsToAdd = Math.min(5, buffer.length);
        const newChars = buffer.substring(0, charsToAdd);
        buffer = buffer.slice(charsToAdd);
        fullResponse += newChars;

        setResponses(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            prompt: currentPrompt,
            content: fullResponse,
            isLoading: false
          };
          return updated;
        });

        if (buffer.length > 0) {
          setTimeout(processBuffer, 5);
        } else {
          isStreaming = false;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

        for (const line of lines) {
          const jsonString = line.replace(/^data:\s*/, '');

          try {
            const parsedChunk = JSON.parse(jsonString);
            const newContent = parsedChunk.content || '';

            if (newContent.length > fullResponse.length) {
              const newText = newContent.slice(fullResponse.length);
              buffer = newText;

              if (!isStreaming) {
                isStreaming = true;
                processBuffer();
              }
            }
          } catch (e) {
            console.warn('Failed to parse SSE chunk:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setResponses(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          prompt: 'Error',
          content: 'Please try again.',
          isLoading: false
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      setPrompt('');
      if (textFieldRef.current) textFieldRef.current.focus();
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPrompt('');
    setResponses([]);
    setIsInputFocused(false);
    setShowHistory(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const fetchChatHistory = async () => {
    try {
      const res = await axiosInstance().get('/generative-ai/assistant/history');
      setChatHistory(res.data.data.history);
      setShowHistory(true);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setResponses([{ prompt: 'Error', content: 'Could not load history', isLoading: false }]);
      setShowHistory(false);
    }
  };

  const handleRetry = (retryPrompt: string) => {
    handleSubmit(retryPrompt);
  };

  const handleInsert = (content: string) => {
    if (!editorRef?.current) {
      console.warn('Editor reference not available');
      return;
    }

    const editor = editorRef.current;
    editor.focus();

    const htmlContent = `
      <div style="white-space: pre-wrap;">
        ${content.replace(/\n/g, '<br>')}
      </div>
    `;

    editor.insertContent(htmlContent);
    handleClose();
  };

  const showSubmitButton = isInputFocused || prompt.trim().length > 0;

  return (
    <>
      <Fab
        color="primary"
        onClick={() => setOpen(true)}
        sx={{ width: 40, height: 40, backgroundColor: theme.palette.mode === 'dark' ? 'background.default' : 'background.paper' }}
      >
        <Avatar src={genieImage} sx={{ width: 30, height: 30 }} />
      </Fab>

      <Dialog
        open={open}
        onClose={handleClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
        maxWidth={false}
      >
        <DialogTitle
          style={{ cursor: 'move' }}
          id="draggable-dialog-title"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            m: '-10px',
            p: '12px',
            borderBottom: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            backgroundColor: theme.palette.background.paper,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box display="flex" alignItems="center">
            <Avatar src={genieImage} sx={{ width: 30, height: 30, ml: 1 }} />
          </Box>
          <Box>
            <Tooltip title={showHistory ? "Hide History" : "Show History"}>
              <IconButton
                onClick={() => {
                  if (!showHistory) {
                    fetchChatHistory();
                  } else {
                    setShowHistory(false);
                  }
                }}
                sx={{ mr: 1 }}
              >
                <HistoryIcon color={showHistory ? "primary" : "inherit"} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Close">
              <IconButton onClick={handleClose}>×</IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>

        <DialogContent sx={{
          p: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: theme.palette.background.default,
        }}>
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.action.disabled,
              borderRadius: '3px',
            },
          }}>
            {showHistory ? (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary }}>Chat History</Typography>
                {chatHistory.length > 0 ? (
                  chatHistory.map((chat: any, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 2,
                        p: 2,
                        backgroundColor: theme.palette.background.paper,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        position: 'relative',
                        '&:hover .insert-btn': {
                          color: 'white',
                          borderColor: 'text.secondary',
                          backgroundColor: 'text.secondary',
                        }
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} sx={{ color: theme.palette.grey[600] }}>
                        {chat.prompt}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                        {chat.response}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Button
                          className="insert-btn"
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => handleInsert(chat.response)}
                          sx={{
                            mr: 1,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            padding: '4px 8px'
                          }}
                        >
                          Insert
                        </Button>
                        <Tooltip title="Copy">
                          <IconButton
                            onClick={() => copyToClipboard(chat.response)}
                            size="small"
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            <CopyIcon fontSize="inherit" sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">No chat history available</Typography>
                )}
              </Box>
            ) : (
              <Box sx={{ p: 1 }}>
                {responses.length === 0 && (
                  <Typography variant="body2" color="textSecondary" sx={{
                    textAlign: 'center',
                    mt: 4,
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.875rem',
                  }}>
                    Ask me anything about your document...
                  </Typography>
                )}
                {responses.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      p: 2,
                      backgroundColor: theme.palette.background.paper,
                      position: 'relative',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      '&:hover .insert-btn': {
                        color: 'white',
                        borderColor: 'text.secondary',
                        backgroundColor: 'text.secondary',
                      }
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontSize: '0.875rem',
                      // color: theme.palette.text.primary,
                      mb: 1,
                      color: theme.palette.grey[600],
                    }}>
                      {item.prompt}
                    </Typography>

                    {item.isLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <>
                        <Box sx={{
                          fontFamily: '"Inter", sans-serif',
                          fontSize: '0.875rem',
                          lineHeight: '1.5',
                          color: theme.palette.text.primary,
                          '& p': {
                            margin: '0.5em 0',
                          },
                          '& pre': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
                            padding: '12px',
                            borderRadius: '4px',
                            overflowX: 'auto',
                          },
                          '& code': {
                            fontFamily: '"Fira Code", monospace',
                            fontSize: '0.85em',
                          },
                        }}>
                          <Markdown remarkPlugins={[remarkGfm]}>{item.content}</Markdown>
                        </Box>

                        <Box sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mt: 2,
                          pt: 1,
                        }}>
                          <Box sx={{ display: 'flex' }}>
                            <Button
                              className="insert-btn"
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => handleInsert(item.content)}
                              sx={{
                                mr: 1,
                                fontSize: '0.75rem',
                                textTransform: 'none',
                                padding: '4px 8px'
                              }}
                            >
                              Insert
                            </Button>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => handleRetry(item.prompt)}
                              disabled={isLoading}
                              sx={{
                                fontSize: '0.75rem',
                                textTransform: 'none',
                                padding: '4px 8px'
                              }}
                            >
                              Retry
                            </Button>
                          </Box>
                          <Tooltip title="Copy">
                            <IconButton
                              onClick={() => copyToClipboard(item.content)}
                              size="small"
                              sx={{ color: theme.palette.text.secondary }}
                            >
                              <CopyIcon fontSize="inherit" sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </>
                    )}
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>
            )}
          </Box>

          {!showHistory ? (
            <Box sx={{
              p: 1,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}>
              <TextField
                inputRef={textFieldRef}
                fullWidth
                multiline
                minRows={1}
                maxRows={4}
                variant="outlined"
                placeholder="Ask me anything..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    paddingRight: '40px',
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.875rem',
                  },
                }}
                InputProps={{
                  endAdornment: showSubmitButton && (
                    <IconButton
                      onClick={() => handleSubmit()}
                      disabled={!prompt.trim() || isLoading}
                      sx={{
                        position: 'absolute',
                        right: 8,
                        bottom: 8,
                        color: theme.palette.primary.main,
                        '&:hover': {
                          backgroundColor: 'transparent',
                        },
                        '&:disabled': {
                          color: theme.palette.action.disabled,
                        }
                      }}
                    >
                      {isLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <SendIcon fontSize="small" />
                      )}
                    </IconButton>
                  ),
                }}
              />
            </Box>
          ) : (
            <Box sx={{
              p: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}></Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AiChatComponent;