import Link from "next/link";

export default function AffiliateDisclosure({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs text-gray-500 italic">
        As an Amazon Associate, we earn from qualifying purchases.{" "}
        <Link href="/affiliate-disclosure" className="underline hover:text-amber-600">
          Learn more
        </Link>
      </p>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
      <p className="text-sm text-amber-800">
        <strong>Affiliate Disclosure:</strong> This article contains affiliate
        links. If you make a purchase through these links, we may earn a small
        commission at no extra cost to you. This helps support our site and
        allows us to continue providing free content.{" "}
        <Link
          href="/affiliate-disclosure"
          className="underline font-medium hover:text-amber-900"
        >
          Full disclosure
        </Link>
      </p>
    </div>
  );
}
