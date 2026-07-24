import { useCallback, useReducer, useEffect } from "react";
import { useApi } from "../app/ApiProvider";
import { useToast } from "../components/ui/Toast";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type ChatState = {
  messages: Message[];
  sessionId?: string;
  isStreaming: boolean;
};

type ChatAction = 
  | { type: "ADD_MESSAGE"; message: Message }
  | { type: "UPDATE_LAST_MESSAGE"; content: string }
  | { type: "REMOVE_LAST_MESSAGE" }
  | { type: "CLEAR_MESSAGES" }
  | { type: "SET_SESSION_ID"; sessionId: string }
  | { type: "SET_STREAMING"; isStreaming: boolean };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "UPDATE_LAST_MESSAGE": {
      const messages = [...state.messages];
      if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
        messages[messages.length - 1].content = action.content;
      }
      return { ...state, messages };
    }
    case "REMOVE_LAST_MESSAGE": {
      return { ...state, messages: state.messages.slice(0, -1) };
    }
    case "CLEAR_MESSAGES": {
      return { ...state, messages: [], sessionId: undefined };
    }
    case "SET_SESSION_ID":
      return { ...state, sessionId: action.sessionId };
    case "SET_STREAMING":
      return { ...state, isStreaming: action.isStreaming };
    default:
      return state;
  }
}

export function useChat(projectId: string) {
  const api = useApi();
  const { addToast } = useToast();
  
  const sessionKey = `chat_session_${projectId}`;
  const messagesKey = `chat_messages_${projectId}`;

  // Read initial messages & session ID from sessionStorage
  const getInitialState = (): ChatState => {
    let initialSessionId: string | undefined = undefined;
    let initialMessages: Message[] = [];

    try {
      const savedSession = sessionStorage.getItem(sessionKey);
      if (savedSession) initialSessionId = savedSession;

      const savedMessages = sessionStorage.getItem(messagesKey);
      if (savedMessages) initialMessages = JSON.parse(savedMessages);
    } catch (e) {
      // Ignore parse errors
    }

    return {
      messages: initialMessages,
      sessionId: initialSessionId,
      isStreaming: false,
    };
  };

  const [state, dispatch] = useReducer(chatReducer, undefined, getInitialState);

  // Sync messages & session to sessionStorage
  useEffect(() => {
    try {
      if (state.messages.length > 0) {
        sessionStorage.setItem(messagesKey, JSON.stringify(state.messages));
      } else {
        sessionStorage.removeItem(messagesKey);
      }

      if (state.sessionId) {
        sessionStorage.setItem(sessionKey, state.sessionId);
      } else {
        sessionStorage.removeItem(sessionKey);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, [state.messages, state.sessionId, messagesKey, sessionKey]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isStreaming) return;
    if (content.length > 2000) {
      addToast({ type: "error", message: "Message exceeds maximum length of 2000 characters." });
      return;
    }

    // Add user message
    const userMsg: Message = { id: `msg_${Date.now()}`, role: "user", content };
    dispatch({ type: "ADD_MESSAGE", message: userMsg });
    
    // Add empty assistant message to start streaming into
    dispatch({ type: "ADD_MESSAGE", message: { id: `msg_${Date.now() + 1}`, role: "assistant", content: "" } });
    dispatch({ type: "SET_STREAMING", isStreaming: true });

    let currentResponse = "";
    
    try {
      const newSessionId = await api.chatStream(
        { project_id: projectId, message: content, session_id: state.sessionId },
        (chunk) => {
          currentResponse += chunk;
          dispatch({ type: "UPDATE_LAST_MESSAGE", content: currentResponse });
        }
      );

      if (newSessionId && newSessionId !== state.sessionId) {
        dispatch({ type: "SET_SESSION_ID", sessionId: newSessionId });
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to send message. Please try again.";
      addToast({ type: "error", message: msg });
      dispatch({ type: "REMOVE_LAST_MESSAGE" });
    } finally {
      dispatch({ type: "SET_STREAMING", isStreaming: false });
    }
  }, [api, projectId, state.sessionId, state.isStreaming, addToast]);

  const clearChat = useCallback(() => {
    dispatch({ type: "CLEAR_MESSAGES" });
    sessionStorage.removeItem(messagesKey);
    sessionStorage.removeItem(sessionKey);
    addToast({ type: "info", message: "Chat history cleared." });
  }, [messagesKey, sessionKey, addToast]);

  return {
    messages: state.messages,
    isStreaming: state.isStreaming,
    sendMessage,
    clearChat,
  };
}
