import { redirect } from "next/navigation";
import { safeAuthReturn, accountUrl } from "@/lib/auth-navigation";
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; redirect?: string }> }) {
  const params = await searchParams;
  redirect(accountUrl("/register", safeAuthReturn(params.next || params.redirect)));
}
