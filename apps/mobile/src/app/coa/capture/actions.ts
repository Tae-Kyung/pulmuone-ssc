"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function uploadCoaPhoto(formData: FormData): Promise<string> {
  const file = formData.get("photo") as File;
  if (!file) throw new Error("파일이 없습니다.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;

  // 웹 앱의 public/uploads에 저장 (같은 서버라 가정)
  const uploadDir = join(process.cwd(), "..", "web", "public", "uploads", "coa");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), buffer);

  return `/uploads/coa/${filename}`;
}
