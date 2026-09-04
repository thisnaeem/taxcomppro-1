import { NextRequest } from "next/server";
import { GET as getLikes } from "../like/route";

export async function GET(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  return getLikes(req, { params });
}
