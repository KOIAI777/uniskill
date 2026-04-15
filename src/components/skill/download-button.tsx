"use client";

import { Icon } from "@/components/ui/icon";
import type { AppLocale } from "@/i18n/config";

export function DownloadButton({
  downloadPath,
  locale = "zh",
}: {
  downloadPath: string;
  locale?: AppLocale;
}) {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = downloadPath;
    a.download = "";
    a.click();
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-3 px-6 py-4 border-2 border-secondary text-secondary rounded-xl hover:bg-secondary hover:text-on-secondary transition-colors"
    >
      <Icon name="download" className="text-xl" filled />
      <span className="font-bold">
        {locale === "en" ? "Download .zip" : "下载 .zip"}
      </span>
    </button>
  );
}
