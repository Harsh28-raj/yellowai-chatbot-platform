import { useState, useRef, useEffect } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "../../components/ui/Button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    
    if (trimmed.length > 2000) {
      // Typically we'd show a toast here or rely on validation, but 
      // simple slicing or just returning is fine for UI limitation
      return;
    }

    onSend(trimmed);
    setValue("");
  };

  return (
    <div className="relative flex w-full items-end gap-2 rounded-xl border border-border bg-surface-subtle p-2 focus-within:ring-2 focus-within:ring-primary/50">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={disabled}
        className="max-h-[200px] w-full resize-none bg-transparent px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        rows={1}
      />
      <div className="shrink-0 pb-1 pr-1">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="h-8 w-8 rounded-lg p-0"
        >
          <SendHorizontal className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
}
