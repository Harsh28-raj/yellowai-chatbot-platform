import axios, { AxiosInstance } from "axios";

export interface ChatMessageRequest {
  project_id: string;
  message: string;
  session_id?: string;
}

export interface ChatMessageResponse {
  message: string;
  session_id: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function extractErrorMessage(data: any): string | null {
  if (!data) return null;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((item: any) => item.msg || item.message || JSON.stringify(item)).join("; ");
  }
  if (typeof data.msg === "string") return data.msg;
  if (typeof data.message === "string") return data.message;
  return null;
}

export class ApiClient {
  private client: AxiosInstance;
  private getToken: () => Promise<string | null>;
  private baseUrl: string;

  constructor(getToken: () => Promise<string | null>) {
    this.getToken = getToken;
    this.baseUrl = import.meta.env.VITE_API_URL || "https://yellowai-chatbot-platform.onrender.com";
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add interceptor to inject auth token
    this.client.interceptors.request.use(async (config) => {
      const token = await this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add interceptor for standardized error handling (422 validation, 429 rate limits, etc.)
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response) {
          const status = error.response.status;
          if (status === 429) {
            return Promise.reject(new ApiError("Rate limit exceeded (20 req/min). Please slow down!", 429));
          }
          if (status === 422) {
            const msg = extractErrorMessage(error.response.data) || "Validation error (422)";
            return Promise.reject(new ApiError(msg, 422));
          }
          const msg = extractErrorMessage(error.response.data) || error.message;
          return Promise.reject(new ApiError(msg, status));
        }
        return Promise.reject(error);
      }
    );
  }

  // --- Projects API ---
  async listProjects(): Promise<Project[]> {
    try {
      const res = await this.client.get<any>("/projects");
      if (Array.isArray(res.data)) {
        return res.data.map((p: any) => ({
          id: p.id || p.project_id || String(p),
          name: p.name || p.title || p.id || "Project",
          createdAt: p.createdAt || p.created_at || new Date().toISOString(),
        }));
      }
      return res.data.projects || [];
    } catch (e: any) {
      // Fallback to localStorage list if endpoint is unavailable
      const local = localStorage.getItem("local_projects");
      if (local) {
        try {
          return JSON.parse(local);
        } catch {}
      }
      return [
        { id: "default_project", name: "Default Project", createdAt: new Date().toISOString() }
      ];
    }
  }

  async createProject(name: string): Promise<Project> {
    try {
      const res = await this.client.post<any>("/projects", { name });
      const newProj = {
        id: res.data.id || res.data.project_id || `proj_${Date.now()}`,
        name: res.data.name || name,
        createdAt: res.data.createdAt || new Date().toISOString(),
      };
      this.saveLocalProject(newProj);
      return newProj;
    } catch (e: any) {
      // Fallback for creating local project if endpoint is not returning expected format
      const newProj: Project = {
        id: `proj_${Date.now()}`,
        name,
        createdAt: new Date().toISOString(),
      };
      this.saveLocalProject(newProj);
      return newProj;
    }
  }

  private saveLocalProject(proj: Project) {
    const local = localStorage.getItem("local_projects");
    let list: Project[] = local ? JSON.parse(local) : [];
    list.push(proj);
    localStorage.setItem("local_projects", JSON.stringify(list));
  }

  // --- Chat API ---
  async chat(req: ChatMessageRequest): Promise<ChatMessageResponse> {
    const res = await this.client.post<ChatMessageResponse>("/chat", req);
    return res.data;
  }

  async chatStream(req: ChatMessageRequest, onChunk: (chunk: string) => void): Promise<string> {
    const token = await this.getToken();
    
    const response = await fetch(`${this.baseUrl}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new ApiError("Rate limit exceeded (20 req/min). Please slow down!", 429);
      }
      const errorData = await response.json().catch(() => null);
      const msg = extractErrorMessage(errorData) || `Stream request failed (${response.status})`;
      throw new ApiError(msg, response.status);
    }

    if (!response.body) throw new ApiError("No readable stream in response");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let sessionId = req.session_id || "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) onChunk(data.chunk);
            if (data.session_id) sessionId = data.session_id;
          } catch (e) {
            // Ignore parse errors on incomplete chunks
          }
        }
      }
    }
    
    return sessionId;
  }

  // --- Upload API ---
  async uploadFile(projectId: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    
    await this.client.post(`/projects/${projectId}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
  }
}
