import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getSEOPageBySlug, getSEOPages, getCityGroups } from "@/lib/sheets";
import {
  generateBreadcrumbJsonLd,
  generateFAQJsonLd,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import FAQ from "@/components/FAQ";

export const revalidate = 3600;

interface Props {
  params: { slug: string };
}

interface ParsedFAQ {
  question: string;
  answer: string;
}

function parseFAQContent(content: string): ParsedFAQ[] {
  const faqs: ParsedFAQ[] = [];
  const lines = content.split("\n");
  let currentQuestion = "";
  let currentAnswer: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("Q:") || trimmed.startsWith("## ")) {
      if (currentQuestion && currentAnswer.length > 0) {
        faqs.push({
          question: currentQuestion,
          answer: currentAnswer.join(" ").trim(),
        });
      }
      currentQuestion = trimmed.replace(/^Q:\s*|^##\s*/, "");
      currentAnswer = [];
    } else if (trimmed.startsWith("A:") && currentQuestion) {
      currentAnswer.push(trimmed.replace(/^A:\s*/, ""));
    } else if (currentQuestion && trimmed.length > 0 && currentAnswer.length > 0) {
      currentAnswer.push(trimmed);
    }
  }

  if (currentQuestion && currentAnswer.length > 0) {
    faqs.push({
      question: currentQuestion,
      answer: currentAnswer.join(" ").trim(),
    });
  }

  return faqs;
}

function renderMarkdown(content: string): React.ReactNode[] {
  const paragraphs = content.split(/\n{2,}/);
  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("# ")) {
      return (
        <h1 key={i} className="text-3xl font-bold text-gray-900 mt-8 mb-4">
          {trimmed.slice(2)}
        </h1>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={i} className="text-2xl font-bold text-gray-900 mt-6 mb-3">
          {trimmed.slice(3)}
        </h2>
      );
    }
    if (trimmed.startsWith("### ")) {
      return (
        <h3 key={i} className="text-xl font-semibold text-gray-900 mt-5 mb-2">
          {trimmed.slice(4)}
        </h3>
      );
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items = trimmed.split("\n").filter((l) => l.trim().startsWith("- ") || l.trim().startsWith("* "));
      return (
        <ul key={i} className="list-disc list-inside space-y-1 text-gray-700 mb-4">
          {items.map((item, j) => (
            <li key={j}>{item.replace(/^[-*]\s*/, "")}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i} className="text-gray-700 leading-relaxed mb-4">
        {trimmed}
      </p>
    );
  }).filter(Boolean) as React.ReactNode[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getSEOPageBySlug(params.slug);
  if (!page) return {};

  const title = page.metaTitle || `${page.title} | ${siteConfig.name}`;
  const description =
    page.metaDescription ||
    page.content?.slice(0, 160).replace(/\n/g, " ") ||
    `Read our comprehensive guide: ${page.title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/guides/${page.slug}`,
    },
  };
}

export async function generateStaticParams() {
  const pages = await getSEOPages();
  return pages.map((p) => ({ slug: p.slug }));
}

export default async function GuidePage({ params }: Props) {
  const [page, allPages, cityGroups] = await Promise.all([
    getSEOPageBySlug(params.slug),
    getSEOPages(),
    getCityGroups(),
  ]);
  if (!page) notFound();

  // Related guides: same city or same topic type
  const relatedGuides = allPages
    .filter((p) => p.slug !== page.slug)
    .filter((p) => (page.city && p.city === page.city) || (!page.city && p.type === page.type))
    .slice(0, 6);

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Guides", url: "/guides" },
    { name: page.title, url: `/guides/${page.slug}` },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  // Detect FAQ content — look for Q: / A: pattern or ## headings followed by answers
  const hasFAQ =
    page.content.includes("Q:") ||
    page.content.includes("FAQ") ||
    page.content.includes("Frequently Asked");

  const faqs = hasFAQ ? parseFAQContent(page.content) : [];
  const faqJsonLd = faqs.length > 0 ? generateFAQJsonLd(faqs) : null;

  // Split content: main body is everything before FAQ section
  const faqSectionIndex = page.content.search(
    /(?:## FAQ|## Frequently Asked Questions|Q:)/i
  );
  const mainContent =
    faqSectionIndex > 0
      ? page.content.slice(0, faqSectionIndex)
      : page.content;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

      <div className="container py-4 sm:py-8">
        <Breadcrumbs items={breadcrumbItems} />

        <article className="mt-4 sm:mt-6 max-w-3xl">
          <header className="mb-6 sm:mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium rounded-full capitalize">
                {page.type}
              </span>
              {page.category && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs sm:text-sm rounded-full">
                  {page.category}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{page.title}</h1>
            {(page.city || page.state) && (
              <p className="text-gray-500 mt-2">
                {[page.city, page.state].filter(Boolean).join(", ")}
              </p>
            )}
          </header>

          <div
            className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: mainContent }}
          />

          {faqs.length > 0 && (
            <div className="mt-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Frequently Asked Questions
              </h2>
              <FAQ items={faqs} />
            </div>
          )}
        </article>

        {/* Related Guides */}
        {relatedGuides.length > 0 && (
          <section className="mt-10 sm:mt-16 max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              {page.city ? `More Guides for ${page.city}` : "Related Guides"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{guide.title}</h3>
                  {guide.city && (
                    <p className="text-xs text-gray-500 mt-1">{guide.city}, {guide.state}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Browse by City */}
        <section className="mt-10 sm:mt-16 max-w-3xl">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Browse Garage Door Repair by City
          </h2>
          <div className="flex flex-wrap gap-2">
            {cityGroups.map((cg) => (
              <Link
                key={`${cg.city}-${cg.state}`}
                href={`/${cg.state.toLowerCase()}/${cg.city.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                {cg.city}, {cg.state} ({cg.count})
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
