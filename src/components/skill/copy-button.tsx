"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

export function CopyButton({
  text,
  label,
  copiedLabel = "已复制!",
  showPreview = true,
}: {
  text: string;
  label: string;
  copiedLabel?: string;
  showPreview?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-3 px-6 py-4 bg-gradient-primary text-on-primary rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
    >
      <Icon name={copied ? "check" : "content_copy"} className="text-xl" />
      <div className="text-left">
        <div className="text-[10px] uppercase tracking-wider opacity-80">
          {copied ? copiedLabel : label}
        </div>
        {showPreview && (
          <div className="text-sm font-mono truncate max-w-[240px]">{text}</div>
        )}
      </div>
    </button>
  );
}
