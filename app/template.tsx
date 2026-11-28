/** Re-mounts per route, so each page (and its loading skeleton) eases in. See .page-enter in globals.css. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
