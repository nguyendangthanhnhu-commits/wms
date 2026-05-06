"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type CameraCaptureProps = {
  onCapture: (imageUrl: string) => void;
  label?: string;
  required?: boolean;
};

export function CameraCapture({ onCapture, label = "Chụp ảnh", required }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sessionId = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError("Không thể mở camera. Vui lòng cấp quyền và thử lại.");
      }
    }

    void start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  async function captureAndUpload() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setBusy(true);
    setError(null);

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas không khả dụng");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
      );

      if (!blob) throw new Error("Không thể tạo ảnh");

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userId = user?.id ?? "anonymous";
      const timestamp = Date.now();
      const path = `attachments/attachment_${userId}_${timestamp}_${sessionId}.jpg`;

      const { error: uploadError } = await supabase.storage.from("attachments").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: false,
      });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("attachments").getPublicUrl(path);

      onCapture(publicUrl);
    } catch {
      setError("Upload ảnh thất bại. Kiểm tra bucket `attachments` và quyền Storage.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </div>
        <Button type="button" onClick={() => void captureAndUpload()} disabled={busy}>
          {busy ? "Đang tải..." : "Chụp & lưu"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-black">
        <video ref={videoRef} className="h-56 w-full object-cover" playsInline muted />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error ? <div className="text-sm text-destructive">{error}</div> : null}
    </div>
  );
}
