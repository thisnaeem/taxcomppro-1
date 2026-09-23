// Shared across the Academy checkout apps. Keep copies identical.
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { SubscriptionTier } from "@prisma/client";

const ENTITY = "ACADEMY_MEMBERSHIP_BONUS";
type Bonus = { userId: string; sessionId: string; expiresAt: string; previousTier: SubscriptionTier };
type PaidSession = { id: string; mode: string | null; payment_status: string; metadata: Record<string,string> | null };
const families = new Set(["30-day-launch","30-day-tax-office-launch","30-day-tax-office","due-diligence-course","audit-playbook","irs-fine-defense","schedule-c-reconstruction","irs-audit-playbook","credits-filing-status","staff-audit-ready","audit-ready-playbook","ultimate-bundle","ultimate-bundle-plus"]);
export function bonusRecordId(userId: string) {
 const hex=createHash("sha256").update(`${ENTITY}:${userId}`).digest("hex");
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
}
export function addTwoMonths(date: Date) {
 const result=new Date(date);const day=result.getUTCDate();result.setUTCDate(1);result.setUTCMonth(result.getUTCMonth()+2);
 const last=new Date(Date.UTC(result.getUTCFullYear(),result.getUTCMonth()+1,0)).getUTCDate();result.setUTCDate(Math.min(day,last));return result;
}
export function isAcademyPurchase(session: PaidSession) {
 const m=session.metadata||{};const [kind,family]=String(m.productKey||"").split(":");
 return session.mode==="payment" && session.payment_status==="paid" && Boolean(m.userId) && (
  (["course","toolkit","bundle"].includes(kind)&&families.has(family)) ||
  (["toolkit","bundle"].includes(m.type)&&(families.has(m.toolkitId||m.bundleId||"")||families.has((m.toolkitId||m.bundleId||"").replace(/-bundle$/,"")))) ||
  (m.type==="course"&&Boolean(m.courseId))
 );
}
export async function grantAcademyMembershipBonus(session: PaidSession, expectedUserId?: string, now=new Date()) {
 const userId=session.metadata?.userId;
 if(!isAcademyPurchase(session)||!userId|| (expectedUserId&&expectedUserId!==userId))return null;
 return prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`academy-bonus:${userId}`}))`;
  const id=bonusRecordId(userId);
  const existing=await tx.academyAuditLog.findUnique({where:{id}});
  if(existing)return {granted:false,...existing.metadata as Bonus};
  const user=await tx.user.findUniqueOrThrow({where:{id:userId},select:{tier:true}});
  const bonus:Bonus={userId,sessionId:session.id,expiresAt:addTwoMonths(now).toISOString(),previousTier:user.tier};
  await tx.academyAuditLog.create({data:{id,action:"ACTIVE",entityType:ENTITY,entityId:userId,metadata:bonus}});
  // This is an access benefit, not a Stripe subscription. Never replace paid billing.
  await tx.user.update({where:{id:userId},data:{tier:"MARKETPLACE_PLUS"}});
  await tx.notification.create({data:{userId,type:"SYSTEM",title:"Your two-month Marketplace Plus bonus is active",message:`Your Academy purchase includes two complimentary months of our highest membership, Marketplace Plus. Access ends ${new Date(bonus.expiresAt).toLocaleDateString("en-US",{timeZone:"UTC",year:"numeric",month:"long",day:"numeric"})}. This one-time bonus does not renew or create a new charge. Any existing paid subscription remains unchanged.`,link:"/upgrade"}});
  return {granted:true,...bonus};
 });
}
export async function reconcileAcademyMembershipBonus(userId:string,now=new Date()) {
 const id=bonusRecordId(userId);
 const record=await prisma.academyAuditLog.findUnique({where:{id}});
 if(!record||record.action!=="ACTIVE")return;
 await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`academy-bonus:${userId}`}))`;
  const current=await tx.academyAuditLog.findUnique({where:{id}});
  if(!current||current.action!=="ACTIVE")return;
  const bonus=current.metadata as Bonus;
  if(new Date(bonus.expiresAt)>now){await tx.user.update({where:{id:userId},data:{tier:"MARKETPLACE_PLUS"}});return;}
  const sub=await tx.subscription.findUnique({where:{userId}});
  const active=sub&&["active","trialing"].includes(sub.status)&&(Boolean(sub.stripeSubscriptionId)||!sub.currentPeriodEnd||sub.currentPeriodEnd>now);
  const tier:SubscriptionTier=active?sub.plan:sub?"FREE":bonus.previousTier;
  await tx.user.update({where:{id:userId},data:{tier}});
  await tx.academyAuditLog.update({where:{id},data:{action:"EXPIRED"}});
  await tx.notification.create({data:{userId,type:"SYSTEM",title:"Your complimentary membership has ended",message:"Your two-month Academy membership bonus has ended. Your purchased courses and toolkits remain available. Any active paid membership continues.",link:"/upgrade"}});
 });
}
