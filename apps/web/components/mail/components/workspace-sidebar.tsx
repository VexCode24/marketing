import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { openCreateWorkspaceOpenAtom } from "@/utils/store";
import { useSetAtom } from "jotai";
import { Building2, Loader2, Plus } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import useSWR from "swr";

type Workspace = {
  id: string;
  name: string;
  image: string | null;
};

type WorkspacesResponse = {
  workspaces: Workspace[];
};

const userNavigation = [
  { name: "Usage", href: "/usage" },
  {
    name: "Sign out",
    href: "#",
    onClick: () => signOut({ callbackUrl: window.location.origin }),
  },
];

export function WorkspaceSidebar() {
  const { data: session, status } = useSession();
  const setCreateWorkspaceOpen = useSetAtom(openCreateWorkspaceOpenAtom);
  const { data, isLoading } = useSWR<WorkspacesResponse>(
    status === "authenticated" ? "/api/workspaces" : null,
  );
  const workspaces = data?.workspaces ?? [];

  return (
    <div className="left-0 top-0 h-screen w-16 flex-col items-center justify-between space-y-2 border-r">
      <div className="flex h-full flex-col justify-between">
        <div className="flex flex-col items-center space-y-4 p-2">
          {isLoading ? (
            <Button className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground/60">
              <Loader2 className="h-5 w-5 animate-spin text-background" />
            </Button>
          ) : workspaces.length > 0 ? (
            workspaces.map((workspace) => (
              <Button
                key={workspace.id}
                title={workspace.name}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground/80 p-0"
              >
                <Avatar className="h-full w-full rounded-xl">
                  <AvatarImage src={workspace.image || undefined} />
                  <AvatarFallback className="rounded-xl bg-foreground/80 font-cal text-xl font-semibold text-background">
                    {getWorkspaceInitials(workspace.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            ))
          ) : (
            <Button className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground/60">
              <Building2 className="h-5 w-5 text-background" />
            </Button>
          )}
          <Button
            onClick={(e) => {
              e.preventDefault();
              setCreateWorkspaceOpen(true);
            }}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground font-cal text-xl font-semibold"
          >
            <Plus className="h-8 w-8 text-background" />
          </Button>
        </div>

        {session && session.user && (
          <div className="flex w-full flex-col items-center pb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src={session?.user.image || undefined} />
                  <AvatarFallback>
                    {session?.user.name ? session.user.name[0] : ""}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
                {userNavigation.map((item) => (
                  <DropdownMenuItem key={item.name}>
                    <a href={item.href} onClick={item.onClick}>
                      {item.name}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

function getWorkspaceInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "WS";
}
