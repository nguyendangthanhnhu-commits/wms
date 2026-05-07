"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";

type CameraCaptureProps = {
  onCapture: (imageUrl: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
};

export function CameraCapture({ onCapture, label = "Chụp ảnh", required, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  const sessionId = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    if (!open) return;
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
        setError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
      }
    }

    void start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  async function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

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
      setCapturedBlob(blob);
    } catch {
      setError("Không thể chụp ảnh. Vui lòng thử lại.");
    }
  }

  async function uploadAndUse() {
    if (!capturedBlob) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userId = user?.id ?? "anonymous";
      const timestamp = Date.now();
      const path = `attachments/${userId}/${timestamp}_${sessionId}.jpg`;

      const { error: uploadError } = await supabase.storage.from("attachments").upload(path, capturedBlob, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("attachments").getPublicUrl(path);

      onCapture(publicUrl);
      setOpen(false);
      setCapturedBlob(null);
    } catch {
      setError("Upload ảnh thất bại. Kiểm tra bucket `attachments` và quyền Storage.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </div>
        <Button type="button" variant="secondary" onClick={() => setOpen(true)} disabled={disabled}>
          Chụp ảnh
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Camera</DialogTitle>
          </DialogHeader>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="overflow-hidden rounded-lg border bg-black">
            <video ref={videoRef} className="h-72 w-full object-cover" playsInline muted />
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <DialogFooter className="gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setCapturedBlob(null)} disabled={!capturedBlob || busy}>
                Chụp lại
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => void capture()} disabled={busy}>
                Chụp
              </Button>
              <Button type="button" onClick={() => void uploadAndUse()} disabled={!capturedBlob || busy}>
                {busy ? "Đang tải..." : "Dùng ảnh này"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
