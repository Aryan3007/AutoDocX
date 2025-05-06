"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Github, 
  Search, 
  Star, 
  Lock, 
  ExternalLink, 
  Loader2 
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
  stargazers_count: number;
  updated_at: string;
}

export default function ImportRepoDialog() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const fetchRepos = React.useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      const data = await res.json();
      setRepos(data);
      setFilteredRepos(data);
    } catch (err) {
      console.error("Failed to fetch repos", err);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (open && session?.accessToken) {
      fetchRepos();
    }
  }, [session, fetchRepos, open]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRepos(repos);
    } else {
      const filtered = repos.filter(repo => 
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRepos(filtered);
    }
  }, [searchTerm, repos]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };
  const router = useRouter();

  // Add this inside the ImportRepoDialog component:
  const handleImport = (repo: GitHubRepo) => {
    // Create a URL-friendly slug from the repo name
    const slug = repo.full_name.replace('/', '--').toLowerCase();
      
    // Store the selected repo info in localStorage for access in the new page
    localStorage.setItem('selectedRepo', JSON.stringify(repo));
    // Set the selected repo
    setSelectedRepo(repo);
    // Close dialog
    setOpen(false);
      
    // Use router.push to navigate programmatically
    router.push(`/dashboard/generate-new-doc/${slug}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-fit justify-start gap-2 bg-black hover:bg-gray-900 hover:text-white text-white transition-colors"
        >
          <Github className="h-4 w-4" />
          <span>Import Repository</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Github className="h-5 w-5" />
            Import GitHub Repository
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a repository from your GitHub account to import
          </p>
        </DialogHeader>
        
        <div className="relative mt-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search repositories..."
            className="pl-10 md:w-full w-fit bg-gray-50 dark:bg-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" className="mt-2">
          <TabsList className="grid md:w-full w-fit grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="public">Public</TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <RepoList 
              repos={filteredRepos} 
              loading={loading} 
              formatDate={formatDate} 
              handleImport={handleImport}
              selectedRepo={selectedRepo}
            />
          </TabsContent>
          
          <TabsContent value="public">
            <RepoList 
              repos={filteredRepos.filter(repo => !repo.private)} 
              loading={loading} 
              formatDate={formatDate} 
              handleImport={handleImport}
              selectedRepo={selectedRepo}
            />
          </TabsContent>
          
          <TabsContent value="private">
            <RepoList 
              repos={filteredRepos.filter(repo => repo.private)} 
              loading={loading} 
              formatDate={formatDate} 
              handleImport={handleImport}
              selectedRepo={selectedRepo}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <div className="flex justify-between w-full items-center">
            <a 
              href="https://github.com/new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Create new repository
            </a>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RepoListProps {
  repos: GitHubRepo[];
  loading: boolean;
  formatDate: (date: string) => string;
  handleImport: (repo: GitHubRepo) => void;
  selectedRepo: GitHubRepo | null;
}

function RepoList({ repos, loading, formatDate, handleImport, selectedRepo }: RepoListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Github className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No repositories found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-72">
      <div className="space-y-2 py-2">
      {repos.map((repo) => (
        <div
        key={repo.id}
        className={`border rounded-lg p-4 hover:bg-gray-50 transition-all ${
          selectedRepo?.id === repo.id ? "ring-2 ring-blue-500" : ""
        }`}
        >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4 min-w-0">
          <Image
            src={repo.owner.avatar_url}
            alt={repo.owner.login}
            width={40}
            height={40}
            className="rounded-full flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-sm truncate">{repo.full_name}</p>
            {repo.private && (
              <Badge variant="outline" className="flex items-center gap-1 h-5">
              <Lock className="h-3 w-3" />
              Private
              </Badge>
            )}
            </div>
            {repo.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
              {repo.description}
            </p>
            )}
            <div className="flex flex-wrap items-center mt-2 text-xs text-gray-500 gap-4">
            <div className="flex items-center">
              <Star className="h-3 w-3 mr-1" />
              {repo.stargazers_count}
            </div>
            <div>Updated on {formatDate(repo.updated_at)}</div>
            </div>
          </div>
          </div>
          <div className="flex gap-2 sm:ml-4">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <Button 
            onClick={() => handleImport(repo)}
            variant="default" 
            size="sm"
            className="whitespace-nowrap"
          >
            Import
          </Button>
          </div>
        </div>
        </div>
      ))}
      </div>
    </ScrollArea>
  );
}