import Link from "next/link";

const links = [
  ["Interactive Map", "/"],
  ["County Rankings", "/rankings"],
  ["FL vs GA", "/comparison"],
  ["Methodology", "/methodology"]
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-civic-blue">Florida & Georgia</p>
            <h1 className="text-lg font-semibold text-civic-navy">Future Student Pipeline Dashboard</h1>
          </div>
          <nav className="flex gap-3 text-sm">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-md px-2 py-1 hover:bg-slate-100">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
