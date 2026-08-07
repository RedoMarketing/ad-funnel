import { CloudPageClient } from "./cloud-page";

// Static export: the four clouds are fixed, so every route is prerendered.
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { slug: "shipping" },
    { slug: "marketing" },
    { slug: "conversion" },
    { slug: "reverse-logistics" },
  ];
}

export default async function CloudPage({ params }: PageProps<"/cloud/[slug]">) {
  const { slug } = await params;
  return <CloudPageClient slug={slug} />;
}
