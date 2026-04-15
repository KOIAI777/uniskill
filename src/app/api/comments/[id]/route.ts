import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { isViewerRole, mapCommentRow, type CommentRow } from "@/lib/comments";

type ProfileRow = {
  role: string | null;
};

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to delete comments." },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete comment." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Comment not found." },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const { id } = await params;
  const body = (await request.json()) as { action?: string };
  if (body.action !== "hide" && body.action !== "restore") {
    return NextResponse.json(
      { error: "Unsupported moderation action." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to moderate comments." },
      { status: 401 }
    );
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileData as ProfileRow | null) ?? null;

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Only administrators can moderate comments." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("comments")
    .update({ status: body.action === "hide" ? "hidden" : "published" })
    .eq("id", id)
    .select(
      "id, target_kind, target_key, author_id, author_name, content, status, created_at, updated_at"
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error:
          body.action === "hide"
            ? "Failed to hide comment."
            : "Failed to restore comment.",
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Comment not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    comment: mapCommentRow(data as CommentRow, {
      currentUserId: user.id,
      viewerRole: isViewerRole(profile.role) ? profile.role : "admin",
    }),
  });
}
