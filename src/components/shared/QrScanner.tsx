"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type QrScannerProps = {
  isOpen: boolean;
  onScan: (code: string) => void;
  onClose: () => void;
};

export function QrScanner({ isOpen, onScan, onClose }: QrScannerProps) {
  const scannerId = useMemo(() => `qr-${Math.random().toString(36).slice(2)}`, []);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const manualRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const scanner = new Html5QrcodeScanner(
      scannerId,
      {
        fps: 10,
        qrbox: { width: 260, height: 260 },
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
      },
      () => {
        // ignore scan errors (continuous)
      }
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(() => {});
      scannerRef.current = null;
    };
  }, [isOpen, onScan, scannerId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quét QR / Barcode</DialogTitle>
        </DialogHeader>

        <div id={scannerId} className="w-full" />

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <Input ref={manualRef} placeholder="Nhập thủ công..." />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const value = manualRef.current?.value.trim();
                if (!value) return;
                onScan(value);
              }}
            >
              Áp dụng
            </Button>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
