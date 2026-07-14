export function SiteFooter() {
  return (
    <footer className="border-t border-dash-border bg-dash-surface">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-sm text-dash-muted">© {new Date().getFullYear()} MyWedly. All rights reserved.</p>
          <p className="text-sm text-dash-muted">Made with love for your special day.</p>
        </div>
      </div>
    </footer>
  );
}
