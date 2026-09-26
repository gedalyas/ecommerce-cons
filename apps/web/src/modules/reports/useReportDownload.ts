import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { ReportRequest } from "@ecommerce/contracts/reports";
import { bytesOfBase64, downloadBlob } from "@/shared/utils/download";
import { downloadReportFn } from "./reportsController";

export function useReportDownload() {
  const download = useServerFn(downloadReportFn);
  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  const save = async (request: ReportRequest) => {
    setDownloading(true);
    setDownloadMessage(null);
    try {
      const result = await download({ data: request });
      if (!result.ok) {
        setDownloadMessage(result.message);
        return;
      }
      const bytes = bytesOfBase64(result.value.base64);
      downloadBlob(result.value.fileName, new Blob([bytes], { type: "application/pdf" }));
    } finally {
      setDownloading(false);
    }
  };
  return { downloading, downloadMessage, save };
}
