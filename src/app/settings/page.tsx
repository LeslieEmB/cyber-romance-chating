import { AppShell } from "@/components/layout/AppShell";
import { AccessGate } from "@/components/auth/AccessGate";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

export default function SettingsPage() {
  return (
    <AccessGate memberOnly>
      <AppShell>
        <SettingsPanel />
      </AppShell>
    </AccessGate>
  );
}
