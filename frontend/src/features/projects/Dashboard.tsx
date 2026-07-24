import { useState } from "react";
import { Link } from "react-router-dom";
import { UserButton } from "@clerk/react";
import { Plus, MessageSquare } from "lucide-react";
import { useProjects } from "../../hooks/useProjects";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/ui/Spinner";

export function Dashboard() {
  const { projects, isLoading, createProject } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    setIsCreating(true);
    try {
      await createProject(newProjectName);
      setNewProjectName("");
      setIsModalOpen(false);
    } catch (err) {
      // Error is handled by hook's toast
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-8">
        <div className="text-xl font-bold tracking-tight text-text">
          yellow<span className="text-primary">.</span>ai
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <Button onClick={() => setIsModalOpen(true)} size="sm">
            <Plus className="mr-1.5 sm:mr-2 h-4 w-4" /> 
            <span>New Project</span>
          </Button>
          <UserButton />
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-2xl font-bold">Your Projects</h1>
          
          {isLoading ? (
            <div className="flex py-12 justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 sm:p-12 text-center">
              <h3 className="mb-2 text-lg font-medium">No projects found</h3>
              <p className="mb-6 text-text-muted">Create a new project to get started.</p>
              <Button onClick={() => setIsModalOpen(true)}>Create Project</Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="flex flex-col transition-colors hover:border-border-hover">
                  <CardHeader>
                    <CardTitle className="truncate">{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="font-mono text-xs text-text-muted">ID: {project.id}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link to={`/chat/${project.id}`} className="w-full">
                      <Button variant="secondary" className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4" /> Open Chat
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Project Name
            </label>
            <Input
              id="name"
              placeholder="e.g. Customer Support Bot"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !newProjectName.trim()}>
              {isCreating ? <Spinner className="mr-2" /> : null}
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
