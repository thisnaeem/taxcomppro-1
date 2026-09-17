import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureProfileSlug } from "@/lib/profileSlug";

// Keep existing directory links working while using one canonical member profile.
export default async function ProfessionalProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { OR: [{ id }, { profileSlug: id }] },
    select: { id: true, name: true, profileSlug: true },
  });
  if (!user) notFound();
  const slug = user.profileSlug || await ensureProfileSlug(user.id, user.name);
  permanentRedirect(`/member/${slug}`);
}
