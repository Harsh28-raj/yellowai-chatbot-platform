import { useState, useRef } from "react";
import { UploadCloud, FileText } from "lucide-react";
import { useUpload } from "../../hooks/useUpload";
import { Button } from "../../components/ui/Button";

interface UploadDropzoneProps {
  projectId: string;
}

export function UploadDropzone({ projectId }: UploadDropzoneProps) {
  const { uploadFile, isUploading, progress } = useUpload(projectId);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
        isDragActive ? "border-primary bg-primary/5" : "border-border bg-surface-subtle hover:bg-surface-muted"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        accept=".txt,.csv,.json"
      />
      
      {isUploading ? (
        <div className="flex w-full flex-col items-center gap-2">
          <FileText className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-sm font-medium">Uploading... {progress}%</p>
          <div className="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-border">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <>
          <UploadCloud className={`mb-3 h-8 w-8 ${isDragActive ? "text-primary" : "text-text-muted"}`} />
          <p className="mb-2 text-sm text-text-muted text-center">
            Drag & drop a file here, or click to select
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={triggerSelect}>
            Select File
          </Button>
        </>
      )}
    </div>
  );
}
