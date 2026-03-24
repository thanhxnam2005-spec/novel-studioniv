import { create } from "zustand";

interface ChatPanelState {
  isOpen: boolean;
  activeConversationId: string | null;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setActiveConversation: (id: string | null) => void;
}

export const useChatPanel = create<ChatPanelState>((set) => ({
  isOpen: false,
  activeConversationId: null,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
}));
