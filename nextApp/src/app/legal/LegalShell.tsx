export default function LegalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="legal-shell position-relative min-vh-100 text-white">
      <div className="legal-bg-1 position-absolute top-0 start-0 end-0 bottom-0" />
      <div className="legal-bg-2 position-absolute top-0 start-0 end-0 bottom-0" />
      <div className="legal-bg-3 position-absolute top-0 start-0 end-0 bottom-0" />

      <main className="position-relative mx-auto d-flex flex-column align-items-center px-3 px-sm-4 py-4 py-sm-5 legal-max-width">
        {children}
      </main>
    </div>
  );
}