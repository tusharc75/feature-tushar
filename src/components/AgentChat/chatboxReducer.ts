import { useReducer } from 'react';

const intialState = {
  sessionId: null,
  loading: false,
  error: null,
  messages: []
};

function reducer(state: TInitialChatboxState, action: TChatboxActions): TInitialChatboxState {
  switch (action.type) {
    case 'setSessionId':
      return {
        ...state,
        sessionId: action.sessionId
      };
    case 'setMessages':
      return {
        ...state,
        messages: action.messages
      };
    case 'setLoading':
      return {
        ...state,
        loading: action.loading
      };
    case 'setError':
      return {
        ...state,
        error: action.error
      };
    case 'initUserMessage': {
      return {
        ...state,
        messages: [...state.messages, { _id: `${Date.now()}`, content: action.payload.query, role: 'user' }],
        loading: true,
        error: null
      };
    }
    case 'setNewUserMessage':
      return {
        ...state,
        messages: [...state.messages, { _id: `${Date.now()}`, content: action.payload.query, role: 'user' }]
      };
    case 'setNewAssistantMessage': {
      return {
        ...state,
        messages: [...state.messages, { _id: `${Date.now()}`, content: action.payload.reply, role: 'assistant' }],
        loading: false,
        ...(!state.sessionId ? { sessionId: action.payload.session } : {})
      };
    }
    case 'reset': {
      return intialState;
    }
    default:
      break;
  }

  return state;
}

export type TInitialChatboxState = {
  sessionId: string | null;
  messages: TMessage[];
  loading: boolean;
  error: string | null;
};

export type TMessage = {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
};

export type TChatboxActions =
  | { type: 'setSessionId'; sessionId: string | null }
  | { type: 'setMessages'; messages: any[] }
  | { type: 'setLoading'; loading: boolean }
  | { type: 'setError'; error: string | null }
  | { type: 'setNewUserMessage'; payload: { query: string } }
  | { type: 'setNewAssistantMessage'; payload: { reply: string; session: string } }
  | { type: 'initUserMessage'; payload: { query: string } }
  | { type: 'reset' };

export const useChatboxReducer = (): [TInitialChatboxState, React.Dispatch<TChatboxActions>] => {
  const [state, dispatch] = useReducer(reducer, intialState);
  return [state, dispatch];
};
