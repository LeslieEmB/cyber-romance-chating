import { AppShell } from "@/components/layout/AppShell";
import { AccessGate } from "@/components/auth/AccessGate";
import { PersonaEditor } from "@/components/persona/PersonaEditor";

export default function PersonaPage() {
  return (
    <AccessGate memberOnly>
      <AppShell>
        <PersonaEditor />
      </AppShell>
    </AccessGate>
  );
}
