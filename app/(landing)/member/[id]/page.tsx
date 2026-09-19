import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureProfileSlug } from "@/lib/profileSlug";
import PublicMemberProfile from "@/components/profile/PublicMemberProfile";

export default async function MemberPage({params}: {params: Promise<{id:string}>}) {
  const {id}=await params;
  const user=await prisma.user.findFirst({where:{OR:[{id},{profileSlug:id}]},select:{id:true,name:true,profileSlug:true,aiSpecialist:{select:{id:true,title:true,starters:true,signature:true,expertise:true,courseNames:true,enabled:true}}}});
  if(!user)notFound();
  const slug=user.profileSlug || await ensureProfileSlug(user.id,user.name);
  if(id!==slug)permanentRedirect('/member/'+slug);
  return <PublicMemberProfile key={user.id} memberId={user.id} specialist={user.aiSpecialist || undefined}/>;
}
