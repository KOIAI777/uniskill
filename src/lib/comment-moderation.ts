import { COMMENT_MAX_LENGTH } from "@/lib/comments";

export interface CommentModerationResult {
  allowed: boolean;
  reason?: string;
}

const BLOCKED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /(论文|作业|考试|essay|assignment)\s*(代写|代做|枪手)/i,
    reason: "评论包含代写、代做等学术诚信风险内容。",
  },
  {
    pattern: /(赌博|博彩|私彩|外围|裸聊|色情|约炮|援交|毒品|买卖账号)/i,
    reason: "评论包含不适合公开展示的违禁推广内容。",
  },
  {
    pattern: /(刷单|返利|贷款|套现|黑产|诈骗|钓鱼链接)/i,
    reason: "评论包含疑似诈骗、黑产或违规引流内容。",
  },
  {
    pattern: /(nigger|faggot|retard|chink|支那|黑鬼)/i,
    reason: "评论包含歧视或攻击性表达。",
  },
];

const CONTACT_PATTERNS = [
  /(加|联系|私聊|私信).{0,8}(微信|vx|v信|qq|telegram|tg|whatsapp|手机|电话)/i,
  /(微信|vx|v信|qq|telegram|tg|whatsapp).{0,8}[:：]?\s?[a-z0-9_-]{4,}/i,
  /(?:\+?86[-\s]?)?1[3-9]\d{9}/,
];

function countUrls(content: string) {
  return (content.match(/https?:\/\/[^\s]+/gi) ?? []).length;
}

function hasRepeatedSpam(content: string) {
  return /(.)\1{14,}/.test(content) || content.split("\n").length > 20;
}

export function moderateCommentContent(content: string): CommentModerationResult {
  const trimmed = content.trim();

  if (!trimmed) {
    return { allowed: false, reason: "评论不能为空。" };
  }

  if (trimmed.length > COMMENT_MAX_LENGTH) {
    return {
      allowed: false,
      reason: `评论不能超过 ${COMMENT_MAX_LENGTH} 个字符。`,
    };
  }

  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { allowed: false, reason };
    }
  }

  if (CONTACT_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return {
      allowed: false,
      reason: "评论区暂不允许发布联系方式、私聊引流或交易信息。",
    };
  }

  if (countUrls(trimmed) > 1) {
    return {
      allowed: false,
      reason: "评论中链接过多，请保留最必要的一个链接。",
    };
  }

  if (hasRepeatedSpam(trimmed)) {
    return {
      allowed: false,
      reason: "评论疑似刷屏或重复内容，请精简后再发布。",
    };
  }

  return { allowed: true };
}
