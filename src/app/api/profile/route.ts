import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateProfileSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Note the absence of `email`: it is verified at signup and anchors the
  // institute-domain restriction, so it is not patchable here by design.
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
    select: { id: true, name: true },
  });

  return NextResponse.json({ user: updated });
}
