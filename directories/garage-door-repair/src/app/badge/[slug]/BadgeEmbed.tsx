"use client";

import { useState } from "react";

interface BadgeEmbedProps {
  badgeUrl: string;
  listingUrl: string;
  businessName: string;
  tierName: string;
}

export default function BadgeEmbed({
  badgeUrl,
  listingUrl,
  businessName,
  tierName,
}: BadgeEmbedProps) {
  const [size, setSize] = useState<"default" | "compact">("default");
  const [copied, setCopied] = useState(false);

  const imgUrl = size === "compact" ? `${badgeUrl}?size=compact` : badgeUrl;
  const width = size === "compact" ? 200 : 280;
  const height = size === "compact" ? 56 : 100;

  const embedCode = `<a href="${listingUrl}" target="_blank" rel="noopener">\n  <img src="${imgUrl}" alt="${tierName} on GarageDoorRepair.Directory" width="${width}" height="${height}" />\n</a>`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = embedCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Embed Code
      </h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSize("default")}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            size === "default"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Standard
        </button>
        <button
          onClick={() => setSize("compact")}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            size === "compact"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Compact
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-3">
        Copy this HTML and paste it into your website (footer, sidebar, or
        &ldquo;About Us&rdquo; page):
      </p>

      <div className="relative">
        <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto whitespace-pre-wrap break-all font-mono">
          {embedCode}
        </pre>
        <button
          onClick={handleCopy}
          className={`absolute top-2 right-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            copied
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        The badge updates automatically -- if your tier changes, the new badge
        will appear without any code changes on your end.
      </p>
    </div>
  );
}
