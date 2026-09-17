
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasNetworkMembership } from "@/lib/networkAccess";

export async function GET(req: NextRequest, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const session = await auth.api.getSession({headers:req.headers});
  const network = await prisma.proNetwork.findUnique({where:{slug}, select:{id:true,ownerId:true}});
  if (!network) return NextResponse.json({error:"Network not found"},{status:404});
  const membership = session?.user ? await prisma.proNetworkMember.findUnique({where:{networkId_userId:{networkId:network.id,userId:session.user.id}}}) : null;
  const isMember = session?.user?.id === network.ownerId || session?.user?.role === "ADMIN" || hasNetworkMembership(membership);
  const events = await prisma.proNetworkEvent.findMany({where:{networkId:network.id},orderBy:{scheduledAt:"asc"},include:{host:{select:{id:true,name:true,image:true}},rsvps:{select:{userId:true}}}});
  const rooms = await prisma.space.findMany({where:{roomName:{in:events.flatMap(e=>e.roomName ? [e.roomName] : [])}},select:{roomName:true,isLive:true,endedAt:true}});
  return NextResponse.json({isMember, events:events.map(({rsvps,...e})=>{
    const room = rooms.find(r=>r.roomName === e.roomName);
    return {...e, roomName:undefined, liveUrl:(!e.isMembersOnly || isMember) ? e.liveUrl : null,
      isLive:room ? room.isLive && !room.endedAt : e.isLive, endedAt:room?.endedAt || null,
      isLocked:e.isMembersOnly && !isMember, isRegistered:rsvps.some(r=>r.userId===session?.user?.id),rsvpCount:rsvps.length};
  })});
}

const eventSchema = z.object({
  title:z.string().trim().min(1).max(180),description:z.string().trim().max(5000).nullish(),
  eventType:z.enum(["PRO_TALK","LIVE_CLASS","WORKSHOP","WEBINAR","QA_SESSION"]).default("PRO_TALK"),
  scheduledAt:z.string().refine(v=>Number.isFinite(Date.parse(v)),"Choose a valid date"),
  durationMinutes:z.coerce.number().int().min(5).max(1440).default(60),
  liveUrl:z.string().url().refine(v=>/^https:\/\//i.test(v),"Use an HTTPS meeting link").nullish(),
  isMembersOnly:z.boolean().default(true),
});
export async function POST(req: NextRequest, {params}: {params:Promise<{slug:string}>}) {
  const {slug}=await params;const session=await auth.api.getSession({headers:req.headers});
  if(!session?.user)return NextResponse.json({error:"Sign in first"},{status:401});
  const network=await prisma.proNetwork.findUnique({where:{slug},select:{id:true,ownerId:true}});
  if(!network)return NextResponse.json({error:"Network not found"},{status:404});
  if(network.ownerId!==session.user.id && session.user.role!=="ADMIN")return NextResponse.json({error:"Only owners can schedule events"},{status:403});
  const parsed=eventSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0].message},{status:400});
  if(Date.parse(parsed.data.scheduledAt)<Date.now()-60000)return NextResponse.json({error:"Choose a future event time"},{status:400});
  const event=await prisma.proNetworkEvent.create({data:{...parsed.data, scheduledAt:new Date(parsed.data.scheduledAt),networkId:network.id,hostId:session.user.id}});
  return NextResponse.json({event},{status:201});
}
