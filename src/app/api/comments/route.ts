import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  COMMENT_MAX_LENGTH,
  COMMENTS_PAGE_SIZE,
  isCommentTargetKind,
  isViewerRole,
  mapCommentRow,
  normalizeCommentContent,
  type CommentRow,
} from "@/lib/comments";
import { moderateCommentContent } from "@/lib/comment-moderation";

type ProfileRow = {
  display_name: string | null;
  role: string | null;
};

async function commentTargetExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  targetKind: "official_skill" | "community_skill",
  targetKey: string
) {
  if (targetKind === "official_skill") {
    const { data } = await supabase
      .from("community_skills")
      .select("id")
      .eq("slug", targetKey)
      .eq("source_type", "official")
      .eq("status", "approved")
      .maybeSingle();

    return Boolean(data);
  }

  const { data } = await supabase
    .from("community_skills")
    .select("id")
    .eq("slug", targetKey)
    .eq("source_type", "community")
    .eq("status", "approved")
    .maybeSingle();

  return Boolean(data);
}

export async function GET(request: NextRequest) {
  const targetKind = request.nextUrl.searchParams.get("targetKind");
  const targetKey = request.nextUrl.searchParams.get("targetKey")?.trim();
  const scope = request.nextUrl.searchParams.get("scope");
  const statusFilter = request.nextUrl.searchParams.get("status");
  const pageParam = request.nextUrl.searchParams.get("page");
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * COMMENTS_PAGE_SIZE;
  const to = from + COMMENTS_PAGE_SIZE - 1;

  const isTargetQuery = targetKind !== null || targetKey !== undefined;
  const isAdminModerationQuery = scope === "admin";
  const isMineQuery = scope === "mine";

  if (
    !isAdminModerationQuery &&
    !isMineQuery &&
    (!isCommentTargetKind(targetKind) || !targetKey)
  ) {
    return NextResponse.json(
      { error: "Missing or invalid targetKind / targetKey." },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let viewerRole: ProfileRow["role"] = null;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    viewerRole =
      ((profileData as Pick<ProfileRow, "role"> | null) ?? null)?.role ?? null;
  }

  if (isAdminModerationQuery) {
    if (viewerRole !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can access moderation feeds." },
        { status: 403 }
      );
    }
  } else if (isMineQuery) {
    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to access your comments." },
        { status: 401 }
      );
    }
  } else if (isTargetQuery && (!isCommentTargetKind(targetKind) || !targetKey)) {
    return NextResponse.json(
      { error: "Missing or invalid targetKind / targetKey." },
      { status: 400 }
    );
  }

  let query = supabase
    .from("comments")
    .select(
      "id, target_kind, target_key, author_id, author_name, content, status, created_at, updated_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (isAdminModerationQuery) {
    if (statusFilter === "published" || statusFilter === "hidden") {
      query = query.eq("status", statusFilter);
    }
  } else if (isMineQuery) {
    query = query.eq("author_id", user!.id);
  } else {
    query = query.eq("target_kind", targetKind).eq("target_key", targetKey);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load comments." },
      { status: 500 }
    );
  }

  const comments = ((data ?? []) as CommentRow[]).map((row) =>
    mapCommentRow(row, {
      currentUserId: user?.id,
      viewerRole: isViewerRole(viewerRole) ? viewerRole : "user",
    })
  );

  return NextResponse.json({
    comments,
    pagination: {
      page,
      pageSize: COMMENTS_PAGE_SIZE,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / COMMENTS_PAGE_SIZE)),
    },
    viewer: {
      email: user?.email ?? null,
      role: isViewerRole(viewerRole) ? viewerRole : "user",
      canModerate: viewerRole === "admin",
    },
  });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to comment." },
      { status: 401 }
    );
  }

  const body = (await request.json()) as {
    targetKind?: string;
    targetKey?: string;
    content?: string;
  };

  const targetKind = body.targetKind ?? null;
  const targetKey = body.targetKey?.trim();
  const content = normalizeCommentContent(body.content ?? "");

  if (!isCommentTargetKind(targetKind) || !targetKey) {
    return NextResponse.json(
      { error: "Missing or invalid comment target." },
      { status: 400 }
    );
  }

  if (!(await commentTargetExists(supabase, targetKind, targetKey))) {
    return NextResponse.json(
      { error: "Comment target was not found or is not publicly available." },
      { status: 404 }
    );
  }

  if (!content || content.length > COMMENT_MAX_LENGTH) {
    return NextResponse.json(
      {
        error: `Comment content must be between 1 and ${COMMENT_MAX_LENGTH} characters.`,
      },
      { status: 400 }
    );
  }

  const moderation = moderateCommentContent(content);

  if (!moderation.allowed) {
    return NextResponse.json(
      { error: moderation.reason || "评论内容不符合社区规则。" },
      { status: 422 }
    );
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileData as ProfileRow | null) ?? null;
  const authorName =
    profile?.display_name?.trim() ||
    (typeof user.user_metadata.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : "") ||
    user.email?.split("@")[0] ||
    "匿名用户";

  const { data, error } = await supabase
    .from("comments")
    .insert({
      target_kind: targetKind,
      target_key: targetKey,
      author_id: user.id,
      author_name: authorName,
      content,
    })
    .select(
      "id, target_kind, target_key, author_id, author_name, content, status, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to publish comment." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      comment: mapCommentRow(data as CommentRow, {
        currentUserId: user.id,
        viewerRole: isViewerRole(profile?.role) ? profile.role : "user",
      }),
    },
    { status: 201 }
  );
}
