import * as React from "react";
import { useAuth } from "@clerk/react";
import { ApiClient } from "../lib/api/ApiClient";

const ApiContext = React.createContext<ApiClient | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  
  // Create stable ApiClient instance injected with getToken
  const apiClient = React.useMemo(() => {
    return new ApiClient(async () => {
      try {
        return await getToken();
      } catch (e) {
        return null;
      }
    });
  }, [getToken]);

  return <ApiContext.Provider value={apiClient}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const context = React.useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
}
