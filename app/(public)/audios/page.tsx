import { LibraryPage, libraryMetadata, type LibrarySearchParams } from "@/components/public/LibraryPage";

type Props = { searchParams: Promise<LibrarySearchParams> };

export async function generateMetadata({ searchParams }: Props) {
  return libraryMetadata("audios", await searchParams);
}

export default async function Page({ searchParams }: Props) {
  return <LibraryPage section="audios" params={await searchParams} />;
}
