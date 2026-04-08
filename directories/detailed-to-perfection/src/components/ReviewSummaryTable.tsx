import { Product } from "@/lib/types";
import { siteConfig } from "@/config/site";
import StarRating from "./StarRating";

function appendTag(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("tag", siteConfig.amazonTag);
    return u.toString();
  } catch {
    return url;
  }
}

export default function ReviewSummaryTable({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <div className="overflow-x-auto mb-8">
      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-4 py-3 font-semibold text-gray-700">#</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Product</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Rating</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Price</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 font-bold text-amber-600">{i + 1}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
              <td className="px-4 py-3">
                <StarRating rating={p.rating} size="sm" />
              </td>
              <td className="px-4 py-3 text-gray-600">{p.price || "---"}</td>
              <td className="px-4 py-3">
                <a
                  href={appendTag(p.amazonUrl)}
                  target="_blank"
                  rel="nofollow sponsored noopener noreferrer"
                  className="text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap"
                >
                  View on Amazon
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
