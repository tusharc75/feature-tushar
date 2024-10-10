import { useReducer } from 'react';

const testMessages = [
  {
    _id: '1728549256611',
    content: 'test',
    role: 'user'
  },
  {
    _id: '1728549261647',
    content:
      'Your query "test" is unclear. Please specify what you would like to do from the following actions:\n1. Create Rental Job\n2. Create Rental Job Material\n\nYou can provide the option number or describe further what you need assistance with.',
    role: 'assistant'
  },
  {
    _id: '1728549270212',
    content: 'test 2',
    role: 'user'
  },
  {
    _id: '1728549277007',
    content:
      "Please provide the following information to proceed with **Create Rental Job Material**:\n1. **Customer account**\n2. **Warehouse** \n\nLet's start with the first requirement:\nPlease provide the **customer account**.",
    role: 'assistant'
  }
];

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
