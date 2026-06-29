"use client";

import { ChatLanding } from "@/components/chat/chat-landing";

export default function HomePage() {
  // Paint the chat immediately. The auth session (and tier/role) is resolved in
  // the background by <AuthSync /> (mounted globally in client-providers.tsx).
  // The chat is fully usable while unauthenticated: the "not signed in" gate is
  // handled inside <ChatLanding />'s handleSend, which opens the auth modal
  // instead of sending. Gating here with isLoaded added a visible skeleton +
  // delay (getSession + /api/user/tier) before the first useful paint.
  return <ChatLanding />;
}
