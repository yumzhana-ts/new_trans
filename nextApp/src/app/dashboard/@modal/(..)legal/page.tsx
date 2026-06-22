import LegalPolicyClient from "@/app/legal/LegalPolicyClient";

export default function LegalModalPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const initialTab = searchParams?.tab === "terms" ? "terms" : "privacy";

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 text-white overflow-auto"
      style={{
        zIndex: 9999,
        background:
          "linear-gradient(180deg, #0a1020 0%, #070b14 45%, #060912 100%)",
      }}
    >
      <div className="d-flex justify-content-center px-3 px-sm-4 py-4 py-sm-5">
        <div style={{ width: "100%", maxWidth: "56rem" }}>
          <LegalPolicyClient initialTab={initialTab} />
        </div>
      </div>
    </div>
  );
}