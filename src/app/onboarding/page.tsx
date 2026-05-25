import { AccessGate } from "@/components/auth/AccessGate";
import { PersonaForm } from "@/components/onboarding/PersonaForm";

export default function OnboardingPage() {
  return (
    <AccessGate>
      <PersonaForm />
    </AccessGate>
  );
}
