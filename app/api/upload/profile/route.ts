import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Handles profile-specific uploads: avatar, cover, and media gallery photos
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const files    = formData.getAll("files") as File[];
  const type     = (formData.get("type") as string) ?? "media"; // "avatar" | "cover" | "media"

  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });
  if (files.length > 10) return NextResponse.json({ error: "Max 10 images" }, { status: 400 });

  const folderMap: Record<string, string> = {
    avatar: "taxcomppro/avatars",
    cover:  "taxcomppro/covers",
    media:  "taxcomppro/profile-media",
    logo:   "taxcomppro/business-logos",
  };
  const folder = folderMap[type] ?? "taxcomppro/profile-media";

  const transformMap: Record<string, object[]> = {
    avatar: [{ width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto:good" }],
    cover:  [{ width: 1400, height: 400, crop: "fill", quality: "auto:good" }],
    media:  [{ width: 1200, crop: "limit", quality: "auto:good" }],
    logo:   [{ width: 500, height: 500, crop: "fit", quality: "auto:good", background: "transparent" }],
  };
  const transformation = transformMap[type] ?? transformMap.media;

  const urls: string[] = [];
  for (const file of files) {
    const buf     = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${file.type};base64,${buf.toString("base64")}`;
    const isVideo = file.type.startsWith("video/");
    const isGif   = file.type === "image/gif";

    if (isVideo && type === "avatar") {
      // Upload video → serve as looping animated GIF (works with all <img> tags)
      const result = await cloudinary.uploader.upload(dataUri, {
        folder, resource_type: "video",
      });
      // Build animated GIF delivery URL: loop forever, crop to square, max 6s
      const base   = result.secure_url.split("/upload/")[0];
      const pubId  = result.public_id;
      const gifUrl = `${base}/upload/e_loop,w_400,h_400,c_fill,g_face,f_gif,so_0,eo_6/${pubId}.gif`;
      urls.push(gifUrl);

    } else if (isGif) {
      // Animated GIF — preserve animation with fl_animated flag
      const result = await cloudinary.uploader.upload(dataUri, {
        folder, resource_type: "image",
        transformation: [{ width: 400, height: 400, crop: "fill", flags: ["animated"], quality: "auto:good" }],
      });
      urls.push(result.secure_url);

    } else {
      // Static image — normal flow
      const result = await cloudinary.uploader.upload(dataUri, { folder, resource_type: "image", transformation });
      urls.push(result.secure_url);
    }
  }

  return NextResponse.json({ urls });
}
