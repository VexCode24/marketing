import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { openCreateWorkspaceOpenAtom } from "@/utils/store";
import { useSetAtom } from "jotai";
import { Building2, Loader2, Mail, Plus, Save, Trash2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import * as React from "react";
import useSWR from "swr";

type EmailAccount = {
  id: string;
  name: string;
  email: string;
};

type Workspace = {
  id: string;
  name: string;
  image: string | null;
  role: "OWNER" | "ADMIN" | "USER";
  emailAccounts: EmailAccount[];
};

type WorkspacesResponse = {
  workspaces: Workspace[];
};

type EmailAccountDraft = {
  name: string;
  email: string;
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
  const { data, isLoading, mutate } = useSWR<WorkspacesResponse>(
    status === "authenticated" ? "/api/workspaces" : null,
  );
  const workspaces = data?.workspaces ?? [];
  const [managingWorkspaceId, setManagingWorkspaceId] = React.useState<
    string | null
  >(null);
  const [emailAccountDraft, setEmailAccountDraft] =
    React.useState<EmailAccountDraft>({ name: "", email: "" });
  const [editingEmailAccounts, setEditingEmailAccounts] = React.useState<
    Record<string, EmailAccountDraft>
  >({});
  const [emailAccountError, setEmailAccountError] = React.useState<
    string | null
  >(null);
  const [isSavingEmailAccount, setIsSavingEmailAccount] =
    React.useState(false);
  const managingWorkspace =
    workspaces.find((workspace) => workspace.id === managingWorkspaceId) ??
    null;

  React.useEffect(() => {
    if (!managingWorkspace) {
      return;
    }

    setEditingEmailAccounts(
      Object.fromEntries(
        managingWorkspace.emailAccounts.map((emailAccount) => [
          emailAccount.id,
          {
            name: emailAccount.name,
            email: emailAccount.email,
          },
        ]),
      ),
    );
    setEmailAccountDraft({ name: "", email: "" });
    setEmailAccountError(null);
  }, [managingWorkspace]);

  const addEmailAccount = async () => {
    if (!managingWorkspace) {
      return;
    }

    const name = emailAccountDraft.name.trim();
    const email = emailAccountDraft.email.trim();
    if (!name || !email) {
      setEmailAccountError("Name and email address are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailAccountError("Enter a valid email account address.");
      return;
    }
    if (
      managingWorkspace.emailAccounts.some(
        (emailAccount) =>
          emailAccount.email.toLowerCase() === email.toLowerCase(),
      )
    ) {
      setEmailAccountError("Email account already exists in this workspace.");
      return;
    }

    setIsSavingEmailAccount(true);
    setEmailAccountError(null);
    const response = await fetch(
      `/api/workspaces/${managingWorkspace.id}/email-accounts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      },
    );
    setIsSavingEmailAccount(false);

    if (!response.ok) {
      setEmailAccountError("Could not add email account.");
      return;
    }

    setEmailAccountDraft({ name: "", email: "" });
    await mutate();
  };

  const updateEmailAccount = async (emailAccount: EmailAccount) => {
    if (!managingWorkspace) {
      return;
    }

    const draft = editingEmailAccounts[emailAccount.id] ?? emailAccount;
    const name = draft.name.trim();
    const email = draft.email.trim();
    if (!name || !email) {
      setEmailAccountError("Name and email address are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailAccountError("Enter a valid email account address.");
      return;
    }
    if (
      managingWorkspace.emailAccounts.some(
        (account) =>
          account.id !== emailAccount.id &&
          account.email.toLowerCase() === email.toLowerCase(),
      )
    ) {
      setEmailAccountError("Email account already exists in this workspace.");
      return;
    }

    setIsSavingEmailAccount(true);
    setEmailAccountError(null);
    const response = await fetch(
      `/api/workspaces/${managingWorkspace.id}/email-accounts/${emailAccount.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      },
    );
    setIsSavingEmailAccount(false);

    if (!response.ok) {
      setEmailAccountError("Could not update email account.");
      return;
    }

    await mutate();
  };

  const deleteEmailAccount = async (emailAccount: EmailAccount) => {
    if (!managingWorkspace) {
      return;
    }

    setIsSavingEmailAccount(true);
    setEmailAccountError(null);
    const response = await fetch(
      `/api/workspaces/${managingWorkspace.id}/email-accounts/${emailAccount.id}`,
      { method: "DELETE" },
    );
    setIsSavingEmailAccount(false);

    if (!response.ok) {
      setEmailAccountError("Could not remove email account.");
      return;
    }

    await mutate();
  };

  return (
    <>
      <div className="left-0 top-0 h-screen w-16 flex-col items-center justify-between space-y-2 border-r">
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col items-center space-y-4 p-2">
            {isLoading ? (
              <Button className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground/60">
                <Loader2 className="h-5 w-5 animate-spin text-background" />
              </Button>
            ) : workspaces.length > 0 ? (
              workspaces.map((workspace) => {
                const canManageEmailAccounts =
                  workspace.role === "OWNER" || workspace.role === "ADMIN";

                return (
                  <DropdownMenu key={workspace.id}>
                    <DropdownMenuTrigger asChild>
                      <Button
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
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="right"
                      className="w-56"
                    >
                      <DropdownMenuLabel>{workspace.name}</DropdownMenuLabel>
                      <DropdownMenuItem
                        disabled={!canManageEmailAccounts}
                        onSelect={(event) => {
                          event.preventDefault();
                          if (canManageEmailAccounts) {
                            setManagingWorkspaceId(workspace.id);
                          }
                        }}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Manage email accounts
                      </DropdownMenuItem>
                      {workspace.emailAccounts.length ? (
                        <>
                          <DropdownMenuSeparator />
                          {workspace.emailAccounts.slice(0, 3).map((account) => (
                            <DropdownMenuItem
                              key={account.id}
                              disabled
                              className="block truncate"
                            >
                              {account.email}
                            </DropdownMenuItem>
                          ))}
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })
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
      <Dialog
        open={!!managingWorkspace}
        onOpenChange={(open) => {
          if (!open) {
            setManagingWorkspaceId(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{managingWorkspace?.name} email accounts</DialogTitle>
            <DialogDescription>
              Add Gmail or Google Workspace accounts that belong to this
              workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {managingWorkspace?.emailAccounts.length ? (
              <div className="space-y-3">
                {managingWorkspace.emailAccounts.map((emailAccount) => {
                  const draft = editingEmailAccounts[emailAccount.id] ?? {
                    name: emailAccount.name,
                    email: emailAccount.email,
                  };

                  return (
                    <div
                      key={emailAccount.id}
                      className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto_auto]"
                    >
                      <div className="flex flex-col space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={draft.name}
                          onChange={(event) => {
                            setEditingEmailAccounts((drafts) => ({
                              ...drafts,
                              [emailAccount.id]: {
                                ...draft,
                                name: event.target.value,
                              },
                            }));
                            setEmailAccountError(null);
                          }}
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={draft.email}
                          onChange={(event) => {
                            setEditingEmailAccounts((drafts) => ({
                              ...drafts,
                              [emailAccount.id]: {
                                ...draft,
                                email: event.target.value,
                              },
                            }));
                            setEmailAccountError(null);
                          }}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          size="icon"
                          variant="secondary"
                          disabled={isSavingEmailAccount}
                          onClick={() => updateEmailAccount(emailAccount)}
                        >
                          <Save className="h-4 w-4" />
                          <span className="sr-only">Save email account</span>
                        </Button>
                      </div>
                      <div className="flex items-end">
                        <Button
                          size="icon"
                          variant="secondary"
                          disabled={isSavingEmailAccount}
                          onClick={() => deleteEmailAccount(emailAccount)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove email account</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <DialogDescription>
                This workspace does not have email accounts yet.
              </DialogDescription>
            )}
            <div className="grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-[1fr_1fr_auto]">
              <div className="flex flex-col space-y-2">
                <Label>New account name</Label>
                <Input
                  placeholder="Support inbox"
                  value={emailAccountDraft.name}
                  onChange={(event) => {
                    setEmailAccountDraft((draft) => ({
                      ...draft,
                      name: event.target.value,
                    }));
                    setEmailAccountError(null);
                  }}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label>New account email</Label>
                <Input
                  type="email"
                  placeholder="support@example.com"
                  value={emailAccountDraft.email}
                  onChange={(event) => {
                    setEmailAccountDraft((draft) => ({
                      ...draft,
                      email: event.target.value,
                    }));
                    setEmailAccountError(null);
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  disabled={
                    isSavingEmailAccount ||
                    (managingWorkspace?.emailAccounts.length ?? 0) >= 10
                  }
                  onClick={addEmailAccount}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
            {emailAccountError ? (
              <DialogDescription className="text-red-500">
                {emailAccountError}
              </DialogDescription>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
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
