'use client'

import { useState } from "react";
import ImportRepoDialog from "@/components/ImportRepoDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Github, FileText, RefreshCw, Filter, Download, BarChart2 } from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

// Mock data for charts (replace with API data)
const projectData = [
  { month: "Jan", projects: 2, endpoints: 10, models: 5, downloads: 3 },
  { month: "Feb", projects: 3, endpoints: 15, models: 8, downloads: 5 },
  { month: "Mar", projects: 4, endpoints: 20, models: 12, downloads: 7 },
  { month: "Apr", projects: 5, endpoints: 25, models: 15, downloads: 10 },
  { month: "May", projects: 5, endpoints: 30, models: 18, downloads: 12 },
];

const docBreakdownData = [
  { name: "Endpoints", value: 48 },
  { name: "Models", value: 23 },
  { name: "Downloads", value: 15 },
];

const recentProjects = [
  {
    name: "api-service",
    description: "REST API service for user management",
    updated: "2 days ago",
    endpoints: 12,
    models: 5,
  },
  {
    name: "payment-gateway",
    description: "Payment processing service",
    updated: "1 week ago",
    endpoints: 8,
    models: 3,
  },
  {
    name: "auth-service",
    description: "Authentication and authorization service",
    updated: "3 days ago",
    endpoints: 10,
    models: 4,
  },
];

const COLORS = ["#3b82f6", "#22c55e", "#6366f1"]; // Tailwind blue, green, indigo

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("30d");

  // Filter projects based on search
  const filteredProjects = recentProjects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
    

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <div className="flex items-center gap-2">
            <ImportRepoDialog />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                <DropdownMenuItem>Export as CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Github className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Docs Generated</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+4 from last month</p>
            </CardContent>
          </Card>
          <Card   className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Generated</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2 days ago</div>
              <p className="text-xs text-muted-foreground">api-service</p>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">128</div>
              <p className="text-xs text-muted-foreground">+15 this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Project Growth</CardTitle>
                  <CardDescription>Monthly project and endpoint additions</CardDescription>
                </CardHeader>
                <CardContent>
                  <LineChart
                    width={500}
                    height={300}
                    data={projectData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    className="w-full"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="projects" stroke="#3b82f6" name="Projects" />
                    <Line type="monotone" dataKey="endpoints" stroke="#22c55e" name="Endpoints" />
                  </LineChart>
                </CardContent>
              </Card>
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Documentation Breakdown</CardTitle>
                  <CardDescription>Distribution of documented items</CardDescription>
                </CardHeader>
                <CardContent>
                  <PieChart width={500} height={300} className="w-full">
                    <Pie
                      data={docBreakdownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {docBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <Card   className="shadow-none">
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-xs"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <Filter className="mr-2 h-4 w-4" /> {timeFilter}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setTimeFilter("7d")}>
                          Last 7 days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTimeFilter("30d")}>
                          Last 30 days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTimeFilter("90d")}>
                          Last 90 days
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProjects.map((repo, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                      <Github className="h-5 w-5" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{repo.name}</p>
                        <p className="text-xs text-muted-foreground">{repo.description}</p>
                        <p className="text-xs text-muted-foreground">Updated {repo.updated}</p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/projects/${repo.name}`}>View Docs</Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Endpoints: {repo.endpoints}, Models: {repo.models}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Documentation Stats</CardTitle>
                <CardDescription>Monthly documentation activity</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  width={500}
                  height={300}
                  data={projectData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  className="w-full"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="endpoints" fill="#3b82f6" name="Endpoints" />
                  <Bar dataKey="models" fill="#22c55e" name="Models" />
                  <Bar dataKey="downloads" fill="#6366f1" name="Downloads" />
                </BarChart>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}