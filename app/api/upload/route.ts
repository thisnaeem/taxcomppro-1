import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const files    = formData.getAll("files") as File[];
  const folder   = (formData.get("folder") as string | null) ?? "taxcomppro/posts";
  // Map shorthand folder names to full Cloudinary paths
  const folderMap: Record<string, string> = {
    "course-thumbnails": "taxcomppro/course-thumbnails",
    "course-articles":   "taxcomppro/course-articles",
  };
  const cloudFolder = folderMap[folder] ?? `taxcomppro/${folder}`;

  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });
  if (files.length > 4)  return NextResponse.json({ error: "Max 4 images" }, { status: 400 });

  const urls: string[] = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);
    const b64         = buffer.toString("base64");
    const dataUri     = `data:${file.type};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder:          cloudFolder,
      resource_type:   "image",
      transformation:  [{ width: 1200, crop: "limit", quality: "auto:good" }],
    });

    urls.push(result.secure_url);
  }

  return NextResponse.json({ urls });
}
