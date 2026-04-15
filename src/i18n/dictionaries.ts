import type { AppLocale } from "@/i18n/config";

const dictionaries = {
  zh: {
    metadata: {
      defaultTitle: "UniSkill - 大学生的 AI 学术工具箱",
      titleTemplate: "%s | UniSkill",
      description:
        "免费下载学校专属 AI Skill，即装即用。作业格式化、引用检查、学术邮件等实用工具，为你的学校定制。",
      openGraphLocale: "zh_CN",
    },
    header: {
      home: "首页",
      schools: "学校",
      community: "社区",
      submit: "投稿",
      about: "关于",
      authSetup: "认证配置",
      loading: "加载中...",
      login: "登录",
      accountFallback: "我的账号",
    },
    footer: {
      about: "关于",
      submit: "投稿 Skill",
      contact: "联系",
      copyright: "Digital Scholar Workshop.",
    },
    language: {
      label: "语言",
      zh: "中文",
      en: "English",
    },
    search: {
      placeholder: "搜索 Skill（如 Essay、Citation...）",
      noResults: "没有找到匹配的 Skill",
      moreResults: "还有 {count} 个结果...",
      featured: "精选",
      community: "社区",
    },
    home: {
      heroTitle: "你的学术 AI 工具箱",
      heroSubtitle:
        "为 BNBU 学生定制的免费 Skill。无需登录，下载即用。",
      targetSchools: "目标学校",
      moreSchools: "更多学校即将上线...",
      submitNotice: "有想分享的 Skill？欢迎投稿到 /upload",
      featuredEyebrow: "精选工具",
      featuredTitle: "精选工具 (Featured Skills)",
      featuredDescription: "最受学生欢迎的学术辅助工具",
      viewAll: "查看全部",
      emptyTitle: "Skills 正在建设中...",
      emptyDescription:
        "我们正在为 BNBU 学生打造专属的 AI 学术工具。想成为第一个贡献者吗？",
      emptyCta: "提交你的第一个 Skill",
      categoriesTitle: "分类浏览 (Categories)",
      categoriesDescription: "快速找到你需要的学术技能场景",
    },
    community: {
      title: "社区",
      description:
        "这里展示平台精选 Skill，以及通过审核的社区 Skill。你可以统一搜索、筛选、下载和评论。",
      submitCta: "提交我的 Skill",
      accountCta: "查看我的投稿",
      featuredEyebrow: "Featured Collection",
      featuredTitle: "精选 Skill",
      featuredDescription: "平台精选与维护的 Skill，适合稳定使用和长期参考。",
      featuredCount: "{count} 个精选 Skill",
      featuredBadge: "精选",
      communityEyebrow: "Community Collection",
      communityTitle: "社区 Skill",
      communityDescription:
        "社区贡献者投稿并通过审核的 Skill，覆盖更多细分场景与学校需求。",
      communityCount: "{count} 个社区 Skill",
      pageStatus: "社区 Skill 第 {page} / {totalPages} 页，共 {count} 个结果",
      previousPage: "上一页",
      nextPage: "下一页",
      emptyTitle: "没有匹配的 Skill",
      emptyDescription:
        "当前筛选条件下没有找到结果。你可以清空筛选后重试，或者投稿新的社区 Skill。",
      emptyCta: "去投稿",
    },
    filters: {
      search: "搜索",
      searchPlaceholder: "搜索名称、描述、标签...",
      searchButton: "搜索",
      category: "分类",
      allCategories: "全部分类",
      school: "学校",
      allSchools: "全部学校",
      generalSchool: "通用 / General",
      customSchool: "自定义学校",
      summary: "当前页面展示 {displayed} 项，筛选命中 {matched} / {total} 项",
      clear: "清空筛选",
    },
    auth: {
      signOutPending: "退出中...",
      signOut: "退出登录",
    },
  },
  en: {
    metadata: {
      defaultTitle: "UniSkill - Your Academic AI Toolbox",
      titleTemplate: "%s | UniSkill",
      description:
        "Download school-specific AI Skills for free. Essay formatting, reference checks, academic email helpers, and more.",
      openGraphLocale: "en_US",
    },
    header: {
      home: "Home",
      schools: "Schools",
      community: "Community",
      submit: "Submit",
      about: "About",
      authSetup: "Auth Setup",
      loading: "Loading...",
      login: "Sign in",
      accountFallback: "Account",
    },
    footer: {
      about: "About",
      submit: "Submit Skill",
      contact: "Contact",
      copyright: "Digital Scholar Workshop.",
    },
    language: {
      label: "Language",
      zh: "中文",
      en: "English",
    },
    search: {
      placeholder: "Search skills (e.g. Essay, Citation...)",
      noResults: "No matching skills found",
      moreResults: "{count} more results...",
      featured: "Featured",
      community: "Community",
    },
    home: {
      heroTitle: "Your Academic AI Toolbox",
      heroSubtitle:
        "Free Skills tailored for BNBU students. No login required, just download and use.",
      targetSchools: "Target Schools",
      moreSchools: "More schools coming soon...",
      submitNotice: "Have a skill to share? Submit it at /upload",
      featuredEyebrow: "Featured Skills",
      featuredTitle: "Featured Skills",
      featuredDescription: "Popular academic helpers students rely on most",
      viewAll: "View all",
      emptyTitle: "Skills are on the way...",
      emptyDescription:
        "We are building a dedicated academic AI toolbox for BNBU students. Want to be the first contributor?",
      emptyCta: "Submit the first Skill",
      categoriesTitle: "Browse by Category",
      categoriesDescription: "Quickly find the academic workflow you need",
    },
    community: {
      title: "Community",
      description:
        "Browse featured Skills and approved community submissions in one place. Search, filter, download, and discuss them together.",
      submitCta: "Submit my Skill",
      accountCta: "View my submissions",
      featuredEyebrow: "Featured Collection",
      featuredTitle: "Featured Skills",
      featuredDescription:
        "Curated and maintained Skills intended for stable, long-term use.",
      featuredCount: "{count} featured Skills",
      featuredBadge: "Featured",
      communityEyebrow: "Community Collection",
      communityTitle: "Community Skills",
      communityDescription:
        "Approved community submissions covering more niche workflows and school-specific needs.",
      communityCount: "{count} community Skills",
      pageStatus: "Community page {page} of {totalPages}, {count} results",
      previousPage: "Previous",
      nextPage: "Next",
      emptyTitle: "No matching Skills",
      emptyDescription:
        "Nothing matches the current filters. Try clearing them or submit a new community Skill.",
      emptyCta: "Submit one",
    },
    filters: {
      search: "Search",
      searchPlaceholder: "Search names, descriptions, or tags...",
      searchButton: "Search",
      category: "Category",
      allCategories: "All categories",
      school: "School",
      allSchools: "All schools",
      generalSchool: "General",
      customSchool: "Custom school",
      summary: "Showing {displayed}; matched {matched} of {total}",
      clear: "Clear filters",
    },
    auth: {
      signOutPending: "Signing out...",
      signOut: "Sign out",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[AppLocale];

export function getDictionary(locale: AppLocale) {
  return dictionaries[locale];
}

export function formatMessage(
  template: string,
  values: Record<string, string | number>
) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template
  );
}
