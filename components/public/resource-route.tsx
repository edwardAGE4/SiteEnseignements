import { cache } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ResourceDetail, resourceMetadata } from "@/components/public/ResourceDetail";
import { getPublicResourceBySlug, getRelatedResources, isInSection } from "@/lib/resources";
import { resourcePath, type Section } from "@/lib/sections";

/* Logique partagee des pages /<rubrique>/[slug]. */

const loadResource = cache((slug: string) => getPublicResourceBySlug(slug));

export async function resourceDetailMetadata(section: Section, slug: string): Promise<Metadata> {
  const resource = await loadResource(slug);
  if (!resource || !isInSection(resource, section)) return { title: "Ressource introuvable" };
  return resourceMetadata(resource);
}

export async function ResourceDetailRoute({ section, slug }: { section: Section; slug: string }) {
  const resource = await loadResource(slug);
  if (!resource) notFound();

  // ressource qui n'a pas sa place dans cette rubrique : redirection vers son URL de reference
  if (!isInSection(resource, section)) permanentRedirect(resourcePath(resource));

  const related = await getRelatedResources(resource, section, 3);
  return <ResourceDetail resource={resource} section={section} related={related} />;
}
