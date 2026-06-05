import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Signs short-lived tokens so the browser can upload images directly to
// Vercel Blob (avoids the 4.5 MB serverless body limit for phone photos).
// Requires BLOB_READ_WRITE_TOKEN in the environment.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Only authenticated portal users may upload.
        const session = await getServerSession(authOptions);
        if (!session?.user) throw new Error("Unauthorized");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          maximumSizeInBytes: 8 * 1024 * 1024, // 8 MB
          addRandomSuffix: true,
        };
      },
      // Fires via webhook on Vercel after upload. We persist the URL when the
      // temple form is submitted, so this is just a no-op hook.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
