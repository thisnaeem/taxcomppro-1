import { prisma } from "@/lib/prisma";

export function profileSlugBase(name: string) {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,64).replace(/-$/g,"") || "member";
}

// Once assigned, a public URL stays stable even when a member changes their display name.
export async function ensureProfileSlug(id:string, name:string) {
  const existing=await prisma.user.findUnique({where:{id},select:{profileSlug:true}});
  if(existing?.profileSlug)return existing.profileSlug;
  const base=profileSlugBase(name);
  for(let n=1;n<=1000;n++) {
    const slug=n===1?base:`${base}-${n}`;
    try {
      await prisma.user.updateMany({where:{id,profileSlug:null},data:{profileSlug:slug}});
      const saved=await prisma.user.findUnique({where:{id},select:{profileSlug:true}});
      if(saved?.profileSlug)return saved.profileSlug;
      throw new Error("Member not found");
    } catch(error) {
      if(!error || typeof error!=="object" || !("code" in error) || error.code!=="P2002") throw error;
    }
  }
  throw new Error("Could not allocate a member URL");
}
