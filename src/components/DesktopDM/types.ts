export type WindowOpenState = 'open' | 'partial' | null | undefined;
export type OpenedChat = { open: WindowOpenState; id: string };

export type UIState = {
  mainWindow: WindowOpenState;
  openedChats: OpenedChat[];
};
