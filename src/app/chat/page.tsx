import { AppShell } from "@/components/layout/AppShell";
import { AccessGate } from "@/components/auth/AccessGate";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatPage() {
  return (
    <AccessGate>
      <AppShell>
        <ChatWindow />
      </AppShell>
    </AccessGate>
  );
}
