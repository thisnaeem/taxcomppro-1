import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasNetworkMembership } from "@/lib/networkAccess";

export async function POST(req:NextRequest,{params}:{params:Promise<{slug:string;eventId:string}>}) {
  const {slug,eventId}=await params; const session=await auth.api.getSession({headers:req.headers});
  if(!session?.user)return NextResponse.json({error:"Sign in first"},{status:401});
  const network=await prisma.proNetwork.findUnique({where:{slug},select:{id:true,ownerId:true}});
  if(!network)return NextResponse.json({error:"Network not found"},{status:404});
  const event=await prisma.proNetworkEvent.findFirst({where:{id:eventId,networkId:network.id}});
  if(!event)return NextResponse.json({error:"Event not found"},{status:404});
  const owner=network.ownerId===session.user.id || session.user.role==="ADMIN";
  const member=await prisma.proNetworkMember.findUnique({where:{networkId_userId:{networkId:network.id,userId:session.user.id}}});
  if(event.isMembersOnly && !owner && !hasNetworkMembership(member))return NextResponse.json({error:"Join this Network to attend"},{status:403});
  if(event.liveUrl && !event.roomName) {
    if (!/^https:\/\//i.test(event.liveUrl)) return NextResponse.json({error:"This event needs a valid HTTPS meeting link"},{status:400});
    return NextResponse.json({url:event.liveUrl});
  }
  let room=event.roomName ? await prisma.space.findUnique({where:{roomName:event.roomName}}) : null;
  if(!room) {
    if(!owner)return NextResponse.json({error:"The host has not started this event yet"},{status:409});
    // A deterministic unique name makes concurrent start clicks converge on one room.
    const roomName=`network-event-${event.id}`;
    room=await prisma.space.upsert({where:{roomName},update:{},create:{roomName,name:event.title,description:event.description,hostId:network.ownerId,visibility:event.isMembersOnly ? "PRIVATE" : "PUBLIC",shareToken:nanoid(32),isLive:true}});
    await prisma.proNetworkEvent.update({where:{id:event.id},data:{roomName,isLive:true}});
  }
  if(room.endedAt)return NextResponse.json({error:"This event has ended"},{status:409});
  const response=NextResponse.json({url:`/pro-talks/${room.id}`});
  if(room.shareToken)response.cookies.set(`pro-talk-invite-${room.id}`,room.shareToken,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:3600*24});
  return response;
}
