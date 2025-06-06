import React, { useState, useRef, useEffect } from 'react';
import { IconButton, Avatar, Typography, Box, TextField, useTheme, CircularProgress, Popover } from '@mui/material';
import { ContentCopy as CopyIcon, Send as SendIcon, History as HistoryIcon } from '@mui/icons-material';
import genieImage from 'src/assets/dashboard_images/sidebar/genie.svg';
import axiosInstance from 'src/axios/axiosInstance';
import { backendApi } from 'src/config';
import remarkGfm from 'remark-gfm';
import Markdown from 'react-markdown';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CloseIcon from '@mui/icons-material/Close';
import Draggable from 'react-draggable';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn } from 'src/constants/helpers';

const GenerativeAiDialog: React.FC<any> = ({ handleInsert, handleClose, anchorEl, existingContent }: any) => {
  const theme = useTheme();
  const [prompt, setPrompt] = useState('');
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [hasExistingContent, setHasExistingContent] = useState(false);
  const [reviewResponse, setReviewResponse] = useState('');
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const textFieldRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sanitizeContent = (content: string): string => {
    let sanitized = content.replace(/<[^>]*>?/gm, '');
    sanitized = sanitized.replace(/<br\s*\/?>/gi, '\n');
    sanitized = sanitized.replace(/&nbsp;/gi, ' ');
    return sanitized.trim();
  };

  useEffect(() => {
    if (existingContent && existingContent.trim().length > 0) {
      setHasExistingContent(true);
      const sanitized = sanitizeContent(existingContent);
      getContentSuggestions(sanitized);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [responses, existingContent]);

  const handleSubmit = async (customPrompt: string | null = null) => {
    const currentPrompt = customPrompt || prompt;
    if (!currentPrompt.trim()) return;

    setIsLoading(true);
    setResponses((prev) => [...prev, { prompt: currentPrompt, content: '', isLoading: true }]);

    try {
      const headers: any = {
        'Content-Type': 'application/json'
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
        body: JSON.stringify({ prompt: currentPrompt })
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
        setResponses((prev) => {
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
        const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data:'));

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
      setResponses((prev) => {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const fetchChatHistory = async () => {
    try {
      const res = await axiosInstance().get('/generative-ai/assistant/history');
      setChatHistory(res.data.data.history);
      setShowHistory(true);
    } catch (error) {
      setResponses([{ prompt: 'Error', content: 'Could not load history', isLoading: false }]);
      setShowHistory(false);
    }
  };

  const handleRetry = (retryPrompt: string) => {
    handleSubmit(retryPrompt);
  };

  const getContentSuggestions = async (content?: string) => {
    setIsReviewLoading(true);
    setReviewResponse('');

    try {
      const headers: any = {
        'Content-Type': 'application/json'
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
        body: JSON.stringify({
          prompt: content,
          type: 'grammerCorrection'
        })
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
        setReviewResponse(fullResponse);
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
        const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data:'));

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
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsReviewLoading(false);
      setReviewResponse('');
    }
  };

  const acceptSuggestions = () => {
    handleInsert(reviewResponse);
    setHasExistingContent(false);
  };

  const dismissSuggestions = () => {
    setHasExistingContent(false);
    handleClose();
  };

  const showSubmitButton = isInputFocused || prompt.trim().length > 0;

  return (
    <Draggable handle="#draggable-paper" cancel={'[class*="MuiDialogContent-root"]'}>
      <Popover
        slotProps={{
          paper: {
            sx: {
              minWidth: 400,
              minHeight: 500,
              maxWidth: 400,
              maxHeight: 500,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }
          }
        }}
        open={true}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'center'
        }}
      >
        <div id="draggable-paper" className="flex w-full cursor-move items-center justify-between border-b p-2">
          <div className="text-left">
            <Avatar src={genieImage} sx={{ width: 30, height: 30 }} />
          </div>
          <div className="text-right">
            <HtmlTooltip title={showHistory ? 'Hide History' : 'Show History'}>
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
                <HistoryIcon fontSize="small" color={'primary'} />
              </IconButton>
            </HtmlTooltip>
            <HtmlTooltip title="Close">
              <IconButton onClick={handleClose}>
                <CloseIcon fontSize="small" color={'primary'} />
              </IconButton>
            </HtmlTooltip>
          </div>
        </div>
        <Box
          sx={{
            p: 2,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {showHistory ? (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.primary }}>
                Chat History
              </Typography>
              {chatHistory.length > 0 ? (
                chatHistory?.map((item: any, index: number) => (
                  <div key={index} className="ml-3 pb-2">
                    <p className="text-gray-500">{item?.prompt}</p>
                    <div className="ai-response pt-1">
                      <Markdown remarkPlugins={[remarkGfm]}>{item?.response}</Markdown>
                    </div>
                    <div className="flex w-full items-center justify-between border-b pb-2 pt-2">
                      <div className="text-left">
                        <ThemeButton buttonType="themeBorder" onClick={() => handleInsert(item?.response)}>
                          Insert
                        </ThemeButton>
                      </div>
                      <div className="text-right">
                        <HtmlTooltip title="Copy">
                          <IconButton onClick={() => copyToClipboard(item?.response)} size="small">
                            <CopyIcon fontSize="small" color="primary" />
                          </IconButton>
                        </HtmlTooltip>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No chat history available
                </Typography>
              )}
            </Box>
          ) : hasExistingContent ? (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, color: theme.palette.text.primary }}>
                Review Suggestions
              </Typography>
              {isReviewLoading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Generating suggestions...
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ p: 1, border: '1px solid #eee', borderRadius: 1, mb: 2 }}>
                    <Markdown remarkPlugins={[remarkGfm]}>{reviewResponse}</Markdown>
                  </Box>
                  <Box sx={{ display: 'flex-start', justifyContent: 'space-between', mt: 2 }}>
                    <ThemeButton buttonType="theme" onClick={acceptSuggestions}>
                      Accept
                    </ThemeButton>
                    <ThemeButton buttonType="transparent" onClick={dismissSuggestions}>
                      Dismiss
                    </ThemeButton>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              {responses?.length === 0 ? (
                <div className="flex h-[350px] items-center justify-center text-center">
                  <img src={genieImage} alt="" className="mr-1 inline size-[24px]" />
                  <span>Ask anything to EGenie</span>
                </div>
              ) : (
                <div className="h-[350px] overflow-auto">
                  {responses.map((item, index) => (
                    <div key={index} className="pb-2">
                      <p className="text-gray-500">{item?.prompt}</p>
                      <div className="ai-response pt-1">
                        <Markdown remarkPlugins={[remarkGfm]}>{item?.content}</Markdown>
                      </div>
                      {item?.isLoading && (
                        <div className="pt-2">
                          <CircularProgress size="12px" />
                          <span className="pl-2 text-sm text-gray-500">Working on it...</span>
                        </div>
                      )}
                      {!item?.isLoading && (
                        <div className="flex w-full items-center justify-between border-b pb-2 pt-2">
                          <div className="text-left">
                            <div className="flex space-x-2">
                              <ThemeButton buttonType="themeBorder" onClick={() => handleInsert(item?.content)}>
                                Insert
                              </ThemeButton>
                              <ThemeButton buttonType="themeBorder" disabled={isLoading} onClick={() => handleRetry(item?.prompt)}>
                                Retry
                              </ThemeButton>
                            </div>
                          </div>
                          <div className="text-right">
                            <HtmlTooltip title="Copy">
                              <IconButton onClick={() => copyToClipboard(item?.content)} size="small">
                                <CopyIcon fontSize="small" color="primary" />
                              </IconButton>
                            </HtmlTooltip>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 10,
                  left: 10,
                  right: 10
                }}
              >
                <div
                  className={cn(
                    'rounded-md [border-width:--border-w] [&_fieldset]:hidden ',
                    '![--animation-duration:8s] ![--border-w:2px] ![--glow-intensity:0.25] ![--spread:4px]',
                    isInputFocused ? '' : `ai-ring border-transparent`
                  )}
                >
                  <TextField
                    inputRef={textFieldRef}
                    fullWidth
                    multiline
                    minRows={1}
                    maxRows={4}
                    variant="outlined"
                    placeholder="Ask anything..."
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
                        border: '0px',
                        borderRadius: '6px'
                      }
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
                              backgroundColor: 'transparent'
                            },
                            '&:disabled': {
                              color: theme.palette.action.disabled
                            }
                          }}
                        >
                          {isLoading ? <CircularProgress size={20} /> : <SendIcon fontSize="small" color="primary" />}
                        </IconButton>
                      )
                    }}
                  />
                </div>
              </Box>
            </Box>
          )}
        </Box>
      </Popover>
    </Draggable>
  );
};

export default GenerativeAiDialog;
