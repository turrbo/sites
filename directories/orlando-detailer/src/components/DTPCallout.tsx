import type { DTPCallout } from "@/lib/internal-links";

export default function DTPCalloutBox({ callout }: { callout: DTPCallout }) {
  return (
    <aside className="my-8 rounded-lg border border-amber-200 bg-amber-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">
        Recommended
      </p>
      <a
        href={callout.url}
        target="_blank"
        rel="noopener"
        className="group block"
      >
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
          {callout.label} &rarr;
        </h3>
        <p className="text-sm text-gray-600 mt-1">{callout.description}</p>
        <span className="inline-block mt-2 text-xs text-amber-600">
          detailedtoperfection.com
        </span>
      </a>
    </aside>
  );
}
