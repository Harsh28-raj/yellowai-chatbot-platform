import { useState, useEffect, useCallback } from "react";
import { useApi } from "../app/ApiProvider";
import { useToast } from "../components/ui/Toast";
import type { Project } from "../lib/api/ApiClient";

export function useProjects() {
  const api = useApi();
  const { addToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.listProjects();
      setProjects(data);
    } catch (err) {
      setError("Failed to fetch projects");
      addToast({ type: "error", message: "Could not load projects" });
    } finally {
      setIsLoading(false);
    }
  }, [api, addToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string) => {
    if (!name.trim()) return;
    try {
      const newProj = await api.createProject(name);
      setProjects((prev) => [...prev, newProj]);
      addToast({ type: "success", message: `Project "${name}" created!` });
      return newProj;
    } catch (err) {
      addToast({ type: "error", message: "Failed to create project" });
      throw err;
    }
  };

  return { projects, isLoading, error, createProject, refresh: fetchProjects };
}
