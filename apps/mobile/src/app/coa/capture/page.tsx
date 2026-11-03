"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Camera, Upload, CheckCircle } from "lucide-react";
import { uploadCoaPhoto } from "./actions";
import { toast } from "sonner";
import Link from "next/link";

export default function CoaCapturePage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [uploadedPath, setUploadedPath] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploaded(false);

    try {
      const fd = new FormData();
      fd.append("photo", file);
      const path = await uploadCoaPhoto(fd);
      setUploadedPath(path);
      setUploaded(true);
      toast.success("COA 이미지 업로드 완료");
    } catch (err) {
      toast.error("업로드 실패");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/">
          <button className="p-2 rounded hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-lg font-bold">COA 촬영</h1>
      </div>

      {!preview ? (
        <div className="space-y-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed rounded-xl p-12 text-center hover:bg-muted/50 transition"
          >
            <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold">카메라로 촬영</p>
            <p className="text-sm text-muted-foreground mt-1">시험성적서를 촬영하세요</p>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCapture}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden border">
            <img src={preview} alt="COA" className="w-full" />
          </div>

          {uploaded ? (
            <div className="rounded-lg bg-green-50 border-2 border-green-200 p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-800">업로드 완료</p>
              <p className="text-sm text-green-600 mt-1">
                웹 관리자 화면에서 검수를 진행하세요.
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                {uploadedPath}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Upload className="h-4 w-4 animate-pulse" />
              <span>업로드 중...</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setPreview(null);
                setUploaded(false);
              }}
              className="flex-1 border border-border py-3 rounded-lg font-semibold"
            >
              재촬영
            </button>
            <Link href="/" className="flex-1">
              <button className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold">
                완료
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
