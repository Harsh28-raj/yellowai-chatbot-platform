import * as React from "react";
import { useAuth } from "@clerk/react";
import { Navigate, Outlet } from "react-router-dom";
import { Spinner } from "../../components/ui/Spinner";

export function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
