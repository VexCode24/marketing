import { auth } from "@/app/api/auth/[...nextauth]/auth";
import prisma from "@/utils/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(80),
  image: z.string().url().optional().nullable(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: {
      organization: {
        include: {
          emailAccounts: {
            select: {
              id: true,
              name: true,
              email: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({
    workspaces: memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      image: membership.organization.image,
      role: membership.role,
      emailAccounts: membership.organization.emailAccounts,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = createWorkspaceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid workspace payload" },
      { status: 400 },
    );
  }

  const workspace = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      image: parsed.data.image || null,
      membership: {
        create: {
          role: "OWNER",
          userId: session.user.id,
        },
      },
    },
    include: {
      emailAccounts: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        image: workspace.image,
        role: "OWNER",
        emailAccounts: workspace.emailAccounts,
      },
    },
    { status: 201 },
  );
}
