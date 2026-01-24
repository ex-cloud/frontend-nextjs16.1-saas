"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  User,
  FolderKanban,
  Users,
  Building2,
  Network,
  Loader2,
  LayoutDashboard,
  Settings,
  UserCircle,
  Shield,
  Activity,
  Plus,
  Clock,
  TrendingUp,
  X,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { useCommandPalette } from "@/components/command-palette-provider";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { ProjectDialog } from "@/components/projects/modals/ProjectDialog";

interface SearchResultItem {
  id: number;
  type: string;
  name: string;
  email?: string;
  code?: string;
  status?: string;
  department?: string;
  position?: string;
  key?: string;
  priority?: string;
  owner?: string;
}

interface EntityResult {
  count: number;
  items: SearchResultItem[];
}

interface SearchResponse {
  [key: string]: EntityResult;
}

interface PopularQuery {
  query: string;
  count: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  users: <User className="mr-2 h-4 w-4 text-blue-500" />,
  projects: <FolderKanban className="mr-2 h-4 w-4 text-purple-500" />,
  teams: <Users className="mr-2 h-4 w-4 text-green-500" />,
  departments: <Building2 className="mr-2 h-4 w-4 text-orange-500" />,
  network_assets: <Network className="mr-2 h-4 w-4 text-cyan-500" />,
};

const typeLabels: Record<string, string> = {
  users: "Users",
  projects: "Projects",
  teams: "Teams",
  departments: "Departments",
  network_assets: "Network Assets",
};

const typeUrls: Record<string, string> = {
  users: "/dashboard/users",
  projects: "/dashboard/projects",
  teams: "/settings/teams",
  departments: "/settings/departments",
  network_assets: "/infrastructure/assets",
};

// Fixed Quick Actions links
const quickActions = [
  { name: "Dashboard", icon: LayoutDashboard, url: "/dashboard" },
  { name: "My Profile", icon: UserCircle, url: "/dashboard/account" }, // Verified path
  { name: "Settings", icon: Settings, url: "/settings" },
  { name: "Users", icon: User, url: "/dashboard/users" },
  { name: "Roles & Permissions", icon: Shield, url: "/dashboard/users/roles" },
  { name: "Projects", icon: FolderKanban, url: "/dashboard/projects" }, // Verified path
  { name: "Activity Logs", icon: Activity, url: "/dashboard/activity" },
];

export function UnifiedCommandPalette() {
  const { isOpen, setIsOpen } = useCommandPalette();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResponse>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Recent Searches (LocalStorage)
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>(
    "recent-searches",
    [],
  );

  // Popular Searches (API)
  const [popularSearches, setPopularSearches] = React.useState<PopularQuery[]>(
    [],
  );

  // Helper state for Create Project Modal
  const [isCreateProjectOpen, setIsCreateProjectOpen] = React.useState(false);

  // Fetch popular searches on open
  React.useEffect(() => {
    if (isOpen) {
      api
        .get<{ success: boolean; data: PopularQuery[] }>(
          "/hrm/search/queries/popular",
        )
        .then((res) => {
          if (res.data.success) {
            setPopularSearches(res.data.data);
          }
        })
        .catch(console.error);
    } else {
      setQuery("");
      setResults({});
    }
  }, [isOpen]);

  // Debounced search
  React.useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults({});
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await api.get<{
          success: boolean;
          data: SearchResponse;
        }>("/hrm/search", {
          params: { q: query, limit: 5 },
        });
        if (response.data.success) {
          setResults(response.data.data || {});
        } else {
          setResults({});
        }
      } catch (error) {
        console.error("Search failed:", error);
        setResults({});
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = (url: string, type?: string, name?: string) => {
    // Add to recent searches if it's a result selection
    if (name) {
      setRecentSearches((prev) => {
        const newSearches = [name, ...prev.filter((s) => s !== name)].slice(
          0,
          5,
        );
        return newSearches;
      });
    }

    setIsOpen(false);
    router.push(url);
  };

  const handleCreateProject = () => {
    setIsOpen(false);
    setIsCreateProjectOpen(true);
  };

  const removeRecent = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => prev.filter((s) => s !== term));
  };

  const hasResults = Object.values(results).some((r) => r.count > 0);

  return (
    <>
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput
          placeholder="Search or jump to... (Ctrl+K)"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* DEFAULT VIEW: Quick Actions, Recent, Popular */}
          {!isLoading && query.length === 0 && (
            <>
              {recentSearches.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Recent Searches">
                    {recentSearches.map((term) => (
                      <CommandItem
                        key={term}
                        value={term}
                        onSelect={() => setQuery(term)}
                      >
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{term}</span>
                        <div
                          className="ml-auto p-1 hover:bg-muted rounded cursor-pointer"
                          onClick={(e) => removeRecent(e, term)}
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {popularSearches.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Popular Searches">
                    {popularSearches.map((item) => (
                      <CommandItem
                        key={item.query}
                        value={item.query}
                        onSelect={() => setQuery(item.query)}
                      >
                        <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{item.query}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {item.count} searches
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              <CommandGroup heading="Quick Actions">
                {quickActions.map((action) => (
                  <CommandItem
                    key={action.url}
                    value={action.name}
                    onSelect={() => handleSelect(action.url)}
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    <span>{action.name}</span>
                  </CommandItem>
                ))}
                <CommandItem
                  value="Create New Project"
                  onSelect={handleCreateProject}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create New Project</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {/* No results message */}
          {!isLoading && query.length >= 2 && !hasResults && (
            <CommandEmpty>
              <p className="text-sm text-foreground">
                No results found for &quot;{query}&quot;
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for users, projects, teams, or departments.
              </p>
            </CommandEmpty>
          )}

          {/* Search results grouped by type */}
          {!isLoading &&
            query.length >= 2 &&
            Object.entries(results).map(([type, data]) => {
              if (data.count === 0) return null;
              return (
                <CommandGroup
                  key={type}
                  heading={`${typeLabels[type] || type} (${data.count})`}
                >
                  {data.items.map((item) => (
                    <CommandItem
                      key={`${type}-${item.id}`}
                      value={item.name + (item.email || "") + (item.code || "")}
                      onSelect={() =>
                        handleSelect(
                          type === "projects"
                            ? `/dashboard/projects/${item.id}/settings`
                            : `${typeUrls[type]}/${item.id}`,
                          type,
                          item.name,
                        )
                      }
                    >
                      {typeIcons[type] || null}
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        {item.email && (
                          <span className="text-xs text-muted-foreground">
                            {item.email}
                          </span>
                        )}
                        {item.code && (
                          <span className="text-xs text-muted-foreground">
                            {item.code}
                          </span>
                        )}
                      </div>
                      {item.department && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {item.department}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
        </CommandList>
      </CommandDialog>
      <ProjectDialog
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
      />
    </>
  );
}
