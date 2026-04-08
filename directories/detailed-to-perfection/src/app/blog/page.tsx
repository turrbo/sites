import Link from "next/link";
import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/sheets";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description: "Tips, trends, and news about auto detailing, ceramic coating, window tinting, and vehicle care.",
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog</h1>
      <p className="text-gray-600 mb-10">
        Tips, trends, and expert insights on keeping your vehicle looking its best.
      </p>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="card overflow-hidden hover:border-amber-200"
            >
              {post.imageUrl && (
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                {post.category && (
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded mb-2">
                    {post.category}
                  </span>
                )}
                <h2 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                )}
                {post.publishedAt && (
                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500">
            Blog posts coming soon! Stay tuned for auto care tips and industry insights.
          </p>
        </div>
      )}
    </div>
  );
}
