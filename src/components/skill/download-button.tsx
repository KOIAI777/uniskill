"use client";

import { Icon } from "@/components/ui/icon";

export function DownloadButton({
  downloadPath,
}: {
  downloadPath: string;
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
      <span className="font-bold">下载 .zip</span>
    </button>
  );
}
