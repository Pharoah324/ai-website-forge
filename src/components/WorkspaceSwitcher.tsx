import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useProfile } from "@/hooks/useProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Briefcase, ChevronDown, Plus, User } from "lucide-react";
import { Link } from "react-router-dom";

export function WorkspaceSwitcher() {
  const { data: profile } = useProfile();
  const { workspaces, activeWorkspace, setActiveWorkspaceId } = useWorkspace();

  if (profile?.plan !== "agency") return null;

  const label = activeWorkspace ? activeWorkspace.name : "Personal";
  const Icon = activeWorkspace ? Briefcase : User;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Icon className="h-3.5 w-3.5" />
          <span className="max-w-[140px] truncate">{label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setActiveWorkspaceId(null)} className="gap-2">
          <User className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">Personal</div>
            <div className="text-xs text-muted-foreground">Your own sites</div>
          </div>
        </DropdownMenuItem>
        {workspaces.map((w) => (
          <DropdownMenuItem key={w.id} onClick={() => setActiveWorkspaceId(w.id)} className="gap-2">
            <Briefcase className="h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium truncate">{w.name}</div>
              <div className="text-xs text-muted-foreground">
                {w.used_build_this_cycle}/{w.monthly_build_allocation} builds
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2">
          <Link to="/app/agency">
            <Plus className="h-4 w-4" />
            Manage client workspaces
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
