import LegalPolicyClient from "./LegalPolicyClient";
import LegalShell from "./LegalShell";

export default function Page({ searchParams }: { searchParams?: { tab?: string } }) {
  const initialTab = searchParams?.tab === "terms" ? "terms" : "privacy";

  return (
    <LegalShell>
      <LegalPolicyClient initialTab={initialTab} />
    </LegalShell>
  );
}