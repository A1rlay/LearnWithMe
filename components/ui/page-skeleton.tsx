import { LoadingLabel } from "@/components/ui/spinner";

/** Route-level loading state: the shape of a typical page, so content lands where the eye already is. */
export function PageSkeleton({ studio = false }: { studio?: boolean }) {
  return (
    <div
      className={studio ? "flex flex-col gap-8" : "mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-24 pt-14 sm:px-6"}
    >
      <div className="flex flex-col gap-3">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-10 w-2/3 max-w-md" />
        <div className="skeleton h-4 w-full max-w-lg" />
      </div>
      <LoadingLabel />
      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="card flex flex-col gap-3 p-5">
            <div className="skeleton h-5 w-1/2" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-4/5" />
            <div className="mt-2 skeleton h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
