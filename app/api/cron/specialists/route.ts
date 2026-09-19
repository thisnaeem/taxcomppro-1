import { timingSafeEqual } from "node:crypto";
import { runSchedule } from "@/lib/specialists/service";
export const maxDuration = 300;
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  const actual = req.headers.get("authorization") || "";
  const wanted = `Bearer ${expected}`;
  if (
    !expected ||
    actual.length !== wanted.length ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(wanted))
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ results: await runSchedule() });
}
