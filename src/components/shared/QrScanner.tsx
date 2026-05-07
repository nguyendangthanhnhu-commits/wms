"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type QrScannerProps = {
  isOpen: boolean;
  onScan: (code: string) => void;
  onClose: () => void;
};

export function QrScanner({ isOpen, onScan, onClose }: QrScannerProps) {
  const scannerId = useMemo(() => `qr-${Math.random().toString(36).slice(2)}`, []);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const manualRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<"scan" | "manual">("scan");

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
    <Sheet open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent side="bottom" className="h-[85vh] p-0 sm:side-left sm:h-full sm:w-[520px]">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>Quét QR / Barcode</SheetTitle>
        </SheetHeader>

        <div className="p-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scan">Quét</TabsTrigger>
              <TabsTrigger value="manual">Nhập thủ công</TabsTrigger>
            </TabsList>

            <TabsContent value="scan" className="mt-4">
              <div className="rounded-xl border p-2">
                <div id={scannerId} className="w-full" />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Giữ camera ổn định và đưa mã vào khung quét.
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <div className="grid gap-2">
                <Input ref={manualRef} placeholder="Nhập mã..." />
                <Button
                  type="button"
                  onClick={() => {
                    const value = manualRef.current?.value.trim();
                    if (!value) return;
                    onScan(value);
                    onClose();
                  }}
                >
                  Xác nhận
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
