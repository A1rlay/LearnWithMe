import { reportAction } from "@/app/buddies/actions";

/** Collapsible report form; works without JS. */
export function ReportForm({
  reportedId,
  messageId = null,
  back,
  label = "Report",
}: {
  reportedId: string;
  messageId?: string | null;
  back: string;
  label?: string;
}) {
  return (
    <details className="group relative">
      <summary className="cursor-pointer list-none text-xs text-muted hover:text-danger">{label}</summary>
      <form
        action={reportAction.bind(null, reportedId, messageId)}
        className="card absolute right-0 z-20 mt-2 flex w-72 flex-col gap-3 p-4 shadow-2xl"
      >
        <input type="hidden" name="back" value={back} />
        <p className="text-sm font-semibold text-fg">Report to the owner</p>
        <select name="category" required className="field py-2" defaultValue="">
          <option value="" disabled>What happened?</option>
          <option>Harassment or bullying</option>
          <option>Inappropriate or sexual content</option>
          <option>Spam or scam</option>
          <option>Seems to be a minor at risk</option>
          <option>Something else</option>
        </select>
        <textarea name="details" rows={3} maxLength={800} placeholder="Details (optional)" className="field py-2" />
        <button type="submit" className="btn bg-danger px-4 py-2 text-canvas hover:bg-danger/85">Send report</button>
      </form>
    </details>
  );
}
