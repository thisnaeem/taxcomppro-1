import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { reconcileAcademyMembershipBonus } from "@/lib/academy-membership-bonus";
export async function GET(request: Request) {
 const expected=process.env.CRON_SECRET;const actual=request.headers.get("authorization")||"";
 const wanted=`Bearer ${expected}`;
 if(!expected||Buffer.byteLength(actual)!==Buffer.byteLength(wanted)||!timingSafeEqual(Buffer.from(actual),Buffer.from(wanted)))return Response.json({error:"Unauthorized"},{status:401});
 const records=await prisma.academyAuditLog.findMany({where:{entityType:"ACADEMY_MEMBERSHIP_BONUS",action:"ACTIVE"},select:{entityId:true}});
 for(const record of records)await reconcileAcademyMembershipBonus(record.entityId);
 return Response.json({checked:records.length});
}
