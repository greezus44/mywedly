export function SiteFooter() {
  return (
    <footer className="border-t border-dash-border bg-dash-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-dash-muted sm:flex-row sm:px-6" style={{ backgroundColor: "var(--dash-header-bg)" }}>
        <p style={{ fontSize: "13px" }}>© {new Date().getFullYear()} My Wedding. All rights reserved.</p>
      </div>
    </footer>
  );
}
