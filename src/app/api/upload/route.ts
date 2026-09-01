import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { MAX_TRIP_IMAGES } from "@/lib/constants";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

/**
 * Writes trip photos to public/uploads and returns their public paths.
 *
 * This is local-disk storage, which suits a single-server or dev deployment.
 * On a serverless host (Vercel) the filesystem is ephemeral and per-instance —
 * swap this for object storage (S3/R2/UploadThing) before deploying there.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected a multipart upload." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files received." }, { status: 400 });
  }
  if (files.length > MAX_TRIP_IMAGES) {
    return NextResponse.json(
      { error: `Up to ${MAX_TRIP_IMAGES} photos at a time.` },
      { status: 400 },
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    const extension = ALLOWED.get(file.type);
    if (!extension) {
      return NextResponse.json(
        { error: "Only JPEG, PNG and WebP images are supported." },
        { status: 415 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Each photo must be under 5MB." }, { status: 413 });
    }

    // Random name: the original filename is attacker-controlled and would let a
    // request write outside the uploads directory.
    const name = `${randomBytes(16).toString("hex")}${extension}`;
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    urls.push(`/uploads/${name}`);
  }

  return NextResponse.json({ urls });
}
