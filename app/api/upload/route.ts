import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import sharp from "sharp";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadBufferToCloudinary(buffer: Buffer, folder: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "webp",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed with no result"));
        } else {
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const folder = (formData.get("folder") as string | null) ?? "taxcomppro/posts";

    const folderMap: Record<string, string> = {
      "course-thumbnails": "taxcomppro/course-thumbnails",
      "course-articles": "taxcomppro/course-articles",
    };
    const cloudFolder = folderMap[folder] ?? `taxcomppro/${folder}`;

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    if (files.length > 4) {
      return NextResponse.json({ error: "Max 4 images allowed per upload" }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      let buffer: Buffer = Buffer.from(arrayBuffer);

      // Automatically optimize & compress image in memory before sending to Cloudinary
      // This prevents Cloudinary's 10MB file limit errors for high-res images
      try {
        const sharpBuffer = await sharp(buffer)
          .rotate() // Auto-orient based on EXIF
          .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 88 })
          .toBuffer();
        buffer = Buffer.from(sharpBuffer);
      } catch (sharpErr) {
        console.warn("Sharp optimization skipped, using raw buffer:", sharpErr);
      }

      const result = await uploadBufferToCloudinary(buffer, cloudFolder);
      urls.push(result.secure_url);
    }

    return NextResponse.json({ urls });
  } catch (err: unknown) {
    console.error("Cloudinary upload error:", err);
    const message = err instanceof Error ? err.message : "Failed to upload image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
