import { useReducer } from 'react';
import { Data, Field } from 'src/components/AgentChat/types';

const intialState = {
  sessionId: null,
  loading: false,
  error: null,
  messages: [],
  isSendButtonDisabled: false
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
        isSendButtonDisabled: false,
        messages: [
          ...state.messages,
          { _id: `${Date.now()}`, content: action.payload.reply, role: 'assistant', fields: action.payload.fields, data: action.payload.data }
        ],
        loading: false,
        ...(!state.sessionId ? { sessionId: action.payload.session } : {})
      };
      break;
    }
    case 'disableSendButton': {
      newState = { ...newState, isSendButtonDisabled: action.payload.disabled };
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
  isSendButtonDisabled: boolean;
};

export type TMessage = {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  fields?: Field[];
  data?: Data;
};

export type TChatboxActions =
  | { type: 'setSessionId'; sessionId: string | null }
  | { type: 'setMessages'; messages: any[] }
  | { type: 'setLoading'; loading: boolean }
  | { type: 'setError'; error: string | null }
  | { type: 'setNewUserMessage'; payload: { query: string } }
  | { type: 'setNewAssistantMessage'; payload: { reply: string; session: string; fields?: Field[]; data?: Data } }
  | { type: 'initUserMessage'; payload: { query: string } }
  | { type: 'reset' }
  | { type: 'disableSendButton'; payload: { disabled: boolean } };

export const useChatboxReducer = (): [TInitialChatboxState, React.Dispatch<TChatboxActions>] => {
  const [state, dispatch] = useReducer(reducer, intialState);
  return [state, dispatch];
};
