import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CreateGroupFlow from "@/components/groups/CreateGroupFlow";
import "@/components/groups/groups.css";

export default async function CreateGroupPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }) : null;
  if (user?.role !== "ADMIN") return (
    <div className="gp-page"><div className="gp-container gp-empty">
      <h1>Group creation is available to admins.</h1>
      <p>Explore existing groups and find your people.</p>
      <Link href="/groups" className="gp-join">Back to groups</Link>
    </div></div>
  );
  return <CreateGroupFlow />;
}
