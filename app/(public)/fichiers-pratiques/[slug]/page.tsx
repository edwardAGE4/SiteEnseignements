import { ResourceDetailRoute, resourceDetailMetadata } from "@/components/public/resource-route";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return resourceDetailMetadata("fichiers-pratiques", (await params).slug);
}

export default async function Page({ params }: Props) {
  return <ResourceDetailRoute section="fichiers-pratiques" slug={(await params).slug} />;
}
