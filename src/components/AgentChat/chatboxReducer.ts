import { useReducer } from 'react';

const intialState = {
  sessionId: null,
  loading: false,
  error: null,
  messages: []
};

function reducer(state: TInitialChatboxState, action: TChatboxActions): TInitialChatboxState {
  let newState = { ...state };
  switch (action.type) {
    case 'setSessionId':
      newState = { ...newState, sessionId: action.sessionId };
      break;
    case 'setMessages':
      newState = { ...newState, messages: action.messages };
      break;
    case 'setLoading':
      newState = { ...newState, loading: action.loading };
      break;
    case 'setError':
      newState = { ...newState, error: action.error };
      break;
    case 'initUserMessage': {
      newState = {
        ...newState,
        messages: [...state.messages, { _id: `${Date.now()}`, content: action.payload.query, role: 'user' }],
        loading: true,
        error: null
      };
      break;
    }
    case 'setNewUserMessage':
      newState = { ...newState, messages: [...state.messages, { _id: `${Date.now()}`, content: action.payload.query, role: 'user' }] };
      break;
    case 'setNewAssistantMessage': {
      newState = {
        ...newState,
        messages: [...state.messages, { _id: `${Date.now()}`, content: action.payload.reply, role: 'assistant' }],
        loading: false,
        ...(!state.sessionId ? { sessionId: action.payload.session } : {})
      };
      break;
    }
    case 'reset': {
      newState = { ...intialState };
      return intialState;
    }
    default:
      break;
  }
  return newState;
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
