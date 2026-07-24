import { cn } from "../../lib/utils";
import { User, Bot } from "lucide-react";
import type { Message } from "../../hooks/useChat";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex w-full items-start gap-2.5 sm:gap-3", {
        "flex-row-reverse": isUser,
        "flex-row": !isUser,
      })}
    >
      {/* Avatar Icon */}
      <div
        className={cn(
          "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold shadow-sm border",
          {
            "bg-primary text-surface-subtle border-primary": isUser,
            "bg-surface-subtle border-border text-primary": !isUser,
          }
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div
        className={cn("relative max-w-[82%] sm:max-w-[75%] rounded-xl px-4 py-3 shadow-sm", {
          "bg-primary text-surface-subtle font-medium": isUser,
          "bg-surface-subtle text-text border border-border": !isUser,
        })}
      >
        <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
          {message.content}
          {!isUser && message.content === "" && (
            <span className="inline-block h-4 w-1.5 animate-pulse bg-primary align-middle ml-1" />
          )}
        </p>
      </div>
    </div>
  );
}
