import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Menu, X, ArrowLeft, Plus, Trash2, FileText, Bot } from "lucide-react";
import { useChat } from "../../hooks/useChat";
import { useProjects } from "../../hooks/useProjects";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { UploadDropzone } from "../upload/UploadDropzone";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";

export function ChatWindow() {
  const { projectId } = useParams<{ projectId: string }>();
  const { messages, isStreaming, sendMessage, clearChat } = useChat(projectId!);
  const { projects, isLoading: projectsLoading } = useProjects();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (projectsLoading) {
    return (
      <div className="flex h-screen w-full bg-surface">
        <div className="hidden w-80 border-r border-border p-4 md:block">
          <Skeleton className="mb-6 h-8 w-3/4" />
          <Skeleton className="mb-2 h-40 w-full" />
        </div>
        <div className="flex flex-1 flex-col p-4">
          <Skeleton className="mb-4 h-12 w-1/2 self-end" />
          <Skeleton className="mb-4 h-24 w-1/2 self-start" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-surface p-4 text-center">
        <h2 className="mb-4 text-2xl font-bold">Project Not Found</h2>
        <Link to="/projects">
          <Button>Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-surface">
      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-border bg-surface-subtle shadow-2xl transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:shadow-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <Link 
            to="/projects" 
            className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All Projects</span>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Project Meta Info */}
        <div className="border-b border-border p-4 bg-surface/50">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-text truncate">{project.name}</h2>
            <Badge variant="success" className="text-[10px] uppercase tracking-wider">Active</Badge>
          </div>
          <p className="font-mono text-[11px] text-text-muted truncate">ID: {project.id}</p>
        </div>
        
        {/* Upload & Context Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Knowledge Base
              </h3>
            </div>
            <UploadDropzone projectId={project.id} />
          </div>

          <div className="rounded-lg border border-border/60 bg-surface/30 p-3 text-xs text-text-muted leading-relaxed">
            💡 Upload plain text or doc files to give your AI assistant domain context for this specific project.
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="border-t border-border p-3 space-y-2">
          {messages.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => {
                clearChat();
                setIsSidebarOpen(false);
              }} 
              className="w-full justify-start text-xs h-9 text-error border-error/20 hover:bg-error/10"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Clear History
            </Button>
          )}
          <Link to="/projects" onClick={() => setIsSidebarOpen(false)} className="block">
            <Button variant="ghost" className="w-full justify-start text-xs h-9">
              <Plus className="mr-2 h-3.5 w-3.5" /> New Project
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col overflow-hidden relative min-w-0 bg-surface">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 bg-surface/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button (Mobile) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg border border-border bg-surface-subtle p-2 text-text hover:bg-surface-muted transition-colors md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 truncate">
              <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-sm">
                Y
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-text truncate text-sm sm:text-base">
                  {project.name}
                </div>
                <div className="text-[11px] text-text-muted flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span>Ready</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-xs text-text-muted hover:text-error"
                title="Clear Chat History"
              >
                <Trash2 className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Clear Chat</span>
              </Button>
            )}
            <Link to="/projects" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-xs text-text-muted hover:text-text">
                Exit
              </Button>
            </Link>
          </div>
        </header>

        {/* Messages Scroll View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-12 sm:pt-24 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted border border-border shadow-inner">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-text">
                  Welcome to {project.name}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-text-muted max-w-[340px] leading-relaxed">
                  Start typing below to chat, or tap the <span className="font-medium text-text">hamburger menu</span> on mobile to upload knowledge files.
                </p>
              </div>
            ) : (
              messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
            )}
            <div ref={bottomRef} className="h-2" />
          </div>
        </div>

        {/* Chat Input Container */}
        <div className="shrink-0 border-t border-border bg-surface p-3 sm:p-4 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <ChatInput onSend={sendMessage} disabled={isStreaming} />
            <div className="mt-2 text-center text-[11px] text-text-muted">
              Yellow.ai Chatbot Platform • Session stored locally
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
