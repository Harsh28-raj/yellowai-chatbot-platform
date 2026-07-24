import { useState, useCallback } from "react";
import { useApi } from "../app/ApiProvider";
import { useToast } from "../components/ui/Toast";

export function useUpload(projectId: string) {
  const api = useApi();
  const { addToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setProgress(0);
    try {
      await api.uploadFile(projectId, file, (pct) => setProgress(pct));
      addToast({ type: "success", message: `File "${file.name}" uploaded successfully.` });
    } catch (err) {
      addToast({ type: "error", message: `Failed to upload "${file.name}".` });
      throw err;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [api, projectId, addToast]);

  return {
    isUploading,
    progress,
    uploadFile,
  };
}
