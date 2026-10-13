import { LibraryPage, libraryMetadata, type LibrarySearchParams } from "@/components/public/LibraryPage";

type Props = { searchParams: Promise<LibrarySearchParams> };

export async function generateMetadata({ searchParams }: Props) {
  return libraryMetadata("livres", await searchParams);
}

export default async function Page({ searchParams }: Props) {
  return <LibraryPage section="livres" params={await searchParams} />;
}
