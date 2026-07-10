export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-onyx/5 py-16 text-center bg-parchment">
      <p className="serif-italic text-xl mb-4">For the unforgettable.</p>
      <p className="eyebrow opacity-50">© {new Date().getFullYear()} Aethel Planning Systems</p>
    </footer>
  );
}
