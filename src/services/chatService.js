// src/services/chatService.js
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/equipt/dms-rag';

export const sendChatMessage = async (message, user = "frontend-user", session = "session-123") => {
  try {
    const response = await axios.post(API_URL, {
      query: message,
      user: user,
      session: session,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};
