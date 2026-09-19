import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function isAdmin(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}
