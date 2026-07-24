import { SignInButton, useAuth } from "@clerk/react";
import { Navigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export function Landing() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  
  if (isSignedIn) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface text-text">
      <header className="flex h-16 items-center justify-between border-b border-border px-8">
        <div className="flex items-center gap-2">
          {/* Simple Wordmark Logo */}
          <div className="text-xl font-bold tracking-tight text-text">
            yellow<span className="text-primary">.</span>ai
          </div>
        </div>
        <SignInButton mode="modal">
          <Button variant="secondary" size="sm">Sign In</Button>
        </SignInButton>
      </header>
      
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
          The Platform for <br />
          <span className="text-primary">AI Chatbots</span>
        </h1>
        <p className="mb-8 max-w-[600px] text-lg text-text-muted">
          Build, deploy, and manage your AI chat projects with ease. 
          A multi-project portal designed for the modern web.
        </p>
        <SignInButton mode="modal">
          <Button size="lg">Get Started</Button>
        </SignInButton>
      </main>
    </div>
  );
}
