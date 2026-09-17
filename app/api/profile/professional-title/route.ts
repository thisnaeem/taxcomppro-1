import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isProfessionalTitle } from "@/lib/professionalTitles";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({error: "Sign in first"}, {status: 401});
  const user = await prisma.user.findUnique({where: {id: session.user.id}, select: {professionalTitle: true}});
  return NextResponse.json(user);
}
export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({error: "Sign in first"}, {status: 401});
  const body = await req.json().catch(() => null);
  if (!isProfessionalTitle(body?.professionalTitle)) return NextResponse.json({error: "Choose a valid professional title"}, {status: 400});
  const user = await prisma.user.update({where: {id: session.user.id}, data: {professionalTitle: body.professionalTitle}, select: {professionalTitle: true}});
  return NextResponse.json(user);
}
