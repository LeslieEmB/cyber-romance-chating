import { AppShell } from "@/components/layout/AppShell";
import { AccessGate } from "@/components/auth/AccessGate";
import { MemoryCenter } from "@/components/memory/MemoryCenter";

export default function MemoryPage() {
  return (
    <AccessGate memberOnly>
      <AppShell>
        <MemoryCenter />
      </AppShell>
    </AccessGate>
  );
}
