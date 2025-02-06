import { useReducer } from 'react';
import { FormValueStateObj, Field, HistoryBody, ReplyBody, Topics, History } from 'src/components/AiChatbox/types';

const intialState = {
  chatId: null,
  loading: false,
  error: null,
  messages: [],
  isSendButtonDisabled: false,
  fullScreen: false,
  topics: [],
  selectedTopics: [],
  chats: [],
  globalLoading: false
};

function reducer(state: TInitialChatboxState, action: TChatboxActions): TInitialChatboxState {
  let newState = { ...state };
  switch (action.type) {
    case 'setMessageFromHistory': {
      const { history, _id } = action.payload;
      const messages = [];
      for (let i = 0; i < history.length; i++) {
        const msg = history[i];
        messages.push({ _id: `${Date.now()}`, content: msg.message, role: 'user' });
        messages.push({ _id: `${Date.now() + i}`, content: msg.content, role: 'assistant', fields: msg.fields });
      }
      newState = { ...newState, chatId: _id, messages, chats: action.payload.history };
      break;
    }
    case 'setError':
      newState = { ...newState, error: action.error };
      break;
    case 'initUserMessage': {
      newState = {
        ...newState,
        messages: [...state.messages, { _id: `${Date.now()}`, content: action.payload, role: 'user' }],
        loading: true,
        error: null
      };
      break;
    }
    case 'setNewAssistantMessage': {
      newState = {
        ...newState,
        isSendButtonDisabled: false,
        messages: [
          ...state.messages,
          {
            _id: `${Date.now()}`,
            content: action.payload.reply.content,
            role: 'assistant',
            fields: action.payload.fields,
            data: action.payload.data,
            question: action.payload.history.message
          }
        ],
        chats: [...state.chats, action.payload.history],
        loading: false,
        ...(!state.chatId ? { chatId: action.payload._id } : {})
      };
      break;
    }
    case 'setGlobalLoading': {
      newState = { ...newState, globalLoading: action.payload };
      break;
    }
    case 'disableSendButton': {
      newState = { ...newState, isSendButtonDisabled: action.payload };
      break;
    }
    case 'setFullScreen': {
      document.body.style.overflow = action.payload ? 'hidden' : '';
      newState = { ...newState, fullScreen: action.payload };
      break;
    }
    case 'setTopics': {
      newState = { ...newState, topics: action.payload };
      break;
    }
    case 'setChats': {
      newState = { ...newState, chats: action.payload };
      break;
    }
    case 'setSelectedTopics': {
      newState = { ...newState, selectedTopics: action.payload };
      break;
    }
    case 'reset': {
      newState = { ...intialState, topics: state.topics };
      break;
    }
    default:
      break;
  }
  return newState;
}

export type TInitialChatboxState = {
  chatId: string | null;
  messages: TMessage[];
  loading: boolean;
  error: string | null;
  isSendButtonDisabled: boolean;
  fullScreen: boolean;
  topics: Topics[];
  selectedTopics: Topics[];
  chats: History[];
  globalLoading: boolean;
};

export type TMessage = {
  _id: string;
  question?: string;
  content: string;
  role: 'user' | 'assistant';
  fields?: Field[];
  data?: FormValueStateObj;
};

export type TChatboxActions =
  | { type: 'setGlobalLoading'; payload: boolean }
  | { type: 'setError'; error: string | null }
  | { type: 'setMessageFromHistory'; payload: HistoryBody }
  | { type: 'setTopics'; payload: Topics[] }
  | { type: 'setSelectedTopics'; payload: Topics[] }
  | { type: 'setNewAssistantMessage'; payload: ReplyBody }
  | { type: 'initUserMessage'; payload: string }
  | { type: 'setChats'; payload: History[] }
  | { type: 'reset' }
  | { type: 'setFullScreen'; payload: boolean }
  | { type: 'disableSendButton'; payload: boolean };

export const useChatboxReducer = (): [TInitialChatboxState, React.Dispatch<TChatboxActions>] => {
  const [state, dispatch] = useReducer(reducer, intialState);
  return [state, dispatch];
};
