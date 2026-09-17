import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureProfileSlug } from "@/lib/profileSlug";
import PublicMemberProfile from "@/components/profile/PublicMemberProfile";

export default async function MemberPage({params}: {params: Promise<{id:string}>}) {
  const {id}=await params;
  const user=await prisma.user.findFirst({where:{OR:[{id},{profileSlug:id}]},select:{id:true,name:true,profileSlug:true}});
  if(!user)notFound();
  const slug=user.profileSlug || await ensureProfileSlug(user.id,user.name);
  if(id!==slug)permanentRedirect('/member/'+slug);
  return <PublicMemberProfile key={user.id} memberId={user.id}/>;
}
