"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QR({ value, size = 140 }: { value: string; size?: number }) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#1F2937", light: "#FFFFFF" },
    }).then(setUrl);
  }, [value, size]);

  return (
    <div className="grid place-items-center rounded-2xl bg-white p-3 shadow-card" style={{ width: size, height: size }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="QR code" width={size - 24} height={size - 24} />
      ) : (
        <div className="h-full w-full animate-pulse rounded-xl bg-bg-secondary" />
      )}
    </div>
  );
}
