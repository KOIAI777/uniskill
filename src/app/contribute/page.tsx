import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { CopyButton } from "@/components/skill/copy-button";
import { SKILL_MD_TEMPLATE_PROMPT } from "@/lib/skill-manifest";

export const metadata: Metadata = {
  title: "投稿指南",
  description:
    "了解如何准备标准 SKILL.md、生成 zip 包、投稿到社区市场，以及在需要时申请进入精选收录。",
};

export default function ContributePage() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
          Submit Guide
        </p>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
          提交你的 Skill
        </h1>
        <p className="text-lg text-on-surface-variant max-w-4xl mb-12 leading-relaxed">
          最推荐的做法是先把 `SKILL.md` 写标准，再打包成 zip，然后进入上传页。上传系统会自动读取
          `SKILL.md` 里的字段来预填表单，所以这一步越规范，后面越省事。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {[
            {
              icon: "auto_awesome",
              title: "先生成标准 SKILL.md",
              desc: "先让 AI 按我们的解析规则生成 frontmatter 和正文结构。",
            },
            {
              icon: "inventory_2",
              title: "再打包成 zip",
              desc: "把 Skill 文件夹和 SKILL.md 一起打包，确保压缩包里能看到 SKILL.md。",
            },
            {
              icon: "upload_file",
              title: "最后去上传",
              desc: "上传页会自动识别名称、描述、分类、学校、标签和版本号。",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-7"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                <Icon name={item.icon} className="text-2xl" filled />
              </div>
              <h2 className="text-2xl font-black mb-3">{item.title}</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-[32px] overflow-hidden bg-inverse-surface text-inverse-on-surface mb-14">
          <div className="p-8 md:p-10 border-b border-white/10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-inverse-primary mb-3">
              Step 1
            </p>
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              先复制这段标准提示词
            </h2>
            <p className="text-sm md:text-base opacity-80 leading-relaxed max-w-3xl mb-6">
              把下面这段提示词直接发给 AI，让它生成一份能被 UniSkill 上传系统稳定解析的标准
              `SKILL.md`。这样后面上传时，系统就能自动识别核心字段，不需要你再手动重复填写。
            </p>

            <div className="flex flex-wrap gap-4">
              <CopyButton
                text={SKILL_MD_TEMPLATE_PROMPT}
                label="复制标准提示词"
                showPreview={false}
              />
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white/10 border border-white/15 font-bold hover:bg-white/20 transition-colors"
              >
                <Icon name="arrow_forward" className="text-lg" />
                准备好后去投稿
              </Link>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <textarea
              readOnly
              value={SKILL_MD_TEMPLATE_PROMPT}
              className="w-full min-h-80 rounded-2xl bg-black/20 border border-white/10 px-4 py-4 font-mono text-xs leading-6 text-inverse-on-surface outline-none resize-y"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
          <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
              Step 2
            </p>
            <h2 className="text-3xl font-black mb-5">AI 生成后检查这些</h2>
            <div className="space-y-4">
              {[
                "frontmatter 里必须保留 `name`、`nameZh`、`description`、`descriptionZh`、`category`、`schools`、`tags`、`version`、`githubUrl`。",
                "`category` 只能填系统支持的六个值之一，不要自己发明新分类名。",
                "`schools` 最好写空数组或一个学校 slug，避免一次写多个学校导致解析提醒。",
                "正文里建议写清楚用途、输入要求、输出规则、边界限制和建议流程。",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-surface-container-low px-4 py-4 text-sm leading-relaxed text-on-surface-variant"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-8 flex flex-col">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
              Step 3
            </p>
            <h2 className="text-3xl font-black mb-5">上传页会自动帮你做什么</h2>

            <div className="space-y-4">
              {[
                "先检查 zip 里是否包含 `SKILL.md`。",
                "自动读取名称、简介、分类、学校、标签和版本号来预填表单。",
                "如果字段不完整，会给出解析提醒，你可以再微调后提交。",
                "审核通过后，社区 Skill 会出现在社区市场并开放评论。",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-surface px-4 py-4 text-sm leading-relaxed text-on-surface-variant"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-outline-variant/20">
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-gradient-primary text-on-primary font-bold"
              >
                <Icon name="upload_file" className="text-lg" />
                去上传页
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-surface-container-lowest p-8 border border-outline-variant/20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
              Recommended
            </p>
            <h2 className="text-3xl font-black mb-4">社区投稿</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              普通投稿统一走社区流程。上传 zip 后系统会自动读取 `SKILL.md`，预填元数据并进入审核。审核通过后，会出现在社区市场并开放评论。
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-gradient-primary text-on-primary font-bold"
            >
              <Icon name="upload_file" className="text-lg" />
              去社区投稿
            </Link>
          </div>

          <div className="rounded-3xl bg-surface-container-low p-8 border border-outline-variant/20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
              Optional
            </p>
            <h2 className="text-3xl font-black mb-4">精选收录 / 合作</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              如果你希望你的 Skill 进入精选目录、首页精选，或者想进行课程合作 / 学校合作，可以额外联系我们。我们会单独评估是否进入精选展示。
            </p>
            <a
              href="mailto:1146850129@qq.com?subject=Featured%20Skill%20Contribution"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold hover:border-primary hover:text-primary transition-colors"
            >
              <Icon name="mail" className="text-lg" />
              联系精选收录
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
