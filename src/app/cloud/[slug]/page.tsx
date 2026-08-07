import { CLOUD_SLUGS } from "@/lib/clouds";
import { CloudPageClient } from "./cloud-page";

// Static export: every cloud route is prerendered from the shared slug list.
export const dynamicParams = false;

export function generateStaticParams() {
  return CLOUD_SLUGS.map((slug) => ({ slug }));
}

export default async function CloudPage({ params }: PageProps<"/cloud/[slug]">) {
  const { slug } = await params;
  return <CloudPageClient slug={slug} />;
}
