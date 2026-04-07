"use client";

import { useEffect, useRef } from "react";

interface AdSlotProps {
  /** Ad slot ID from AdSense (data-ad-slot) */
  slot?: string;
  /** Ad format: auto, horizontal, vertical, rectangle */
  format?: string;
  /** Label text shown above the ad */
  label?: string;
  className?: string;
}

export function AdSlot({
  slot,
  format = "auto",
  label = "Advertisement",
  className = "",
}: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded yet
    }
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <p className="text-[10px] text-center text-outline-variant uppercase tracking-widest mb-2">
        {label}
      </p>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5351543782524348"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
