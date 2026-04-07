import { Icon } from "@/components/ui/icon";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于 UniSkill",
  description:
    "UniSkill 是一个免费的大学生 AI 学术工具平台，为学生提供即装即用的 Claude Code Skills。",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
            Our Mission
          </p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
            让每个大学生都能用上
            <br />
            <span className="text-gradient">AI 学术工具</span>
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl leading-relaxed">
            UniSkill 是一个免费的 AI 学术工具平台，为大学生提供
            <span className="text-primary font-semibold">开箱即用</span>
            的 Claude Code Skill。
            无需登录，下载即用，为你的学校定制。
          </p>
        </div>
      </section>

      {/* Features + Terminal */}
      <section className="py-24 px-6 bg-surface-container-low">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-10">
            {[
              {
                icon: "auto_awesome",
                title: "AI 驱动的学术工具",
                desc: "基于 Claude Code SKILL.md 标准格式，每个 Skill 都是经过精心设计的 AI 学术助手。",
              },
              {
                icon: "school",
                title: "为你的学校定制",
                desc: "不同学校有不同的作业要求。我们为每个学校提供专属的格式化、引用检查等工具。",
              },
              {
                icon: "hub",
                title: "社区共建",
                desc: "任何人都可以为自己的学校创建和提交 Skill，让工具越来越好。",
              },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <Icon
                  name={feature.icon}
                  className="text-3xl text-primary flex-shrink-0"
                />
                <div>
                  <h3 className="text-lg font-bold mb-1">{feature.title}</h3>
                  <p className="text-on-surface-variant">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Terminal mockup */}
          <div className="bg-surface-container-lowest p-8 rounded-xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-error" />
              <div className="w-3 h-3 rounded-full bg-secondary-fixed-dim" />
              <div className="w-3 h-3 rounded-full bg-inverse-primary" />
            </div>
            <pre className="font-mono text-sm leading-relaxed text-on-surface-variant whitespace-pre-wrap">
{`$ claude skill install \\
  https://uniskill.online/skills/bnbu-essay-formatter.zip

✓ Downloading skill...
✓ Installing to ~/.claude/skills/
✓ Done! Skill is ready to use.

$ claude
> 你好！我已加载 BNBU Essay Formatter。
> 请粘贴你的作业内容，我来帮你格式化。`}
            </pre>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black mb-12">生态系统</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large card */}
            <div className="md:col-span-2 bg-inverse-surface text-inverse-on-surface rounded-xl p-8">
              <h3 className="text-2xl font-black mb-4">
                Free Forever
              </h3>
              <p className="text-sm opacity-80 mb-6">
                所有 Skill 完全免费，任何人都可以审查和贡献。
                我们相信学术工具应该对每个学生免费开放。
              </p>
              <a
                href="mailto:1146850129@qq.com?subject=合作咨询"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-on-primary font-bold rounded-xl"
              >
                <Icon name="mail" className="text-lg" />
                联系合作
              </a>
            </div>

            {/* Small card */}
            <div className="bg-surface-container-lowest rounded-xl p-8 flex flex-col justify-between">
              <div>
                <Icon name="mail" className="text-3xl text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">联系我们</h3>
                <p className="text-sm text-on-surface-variant mb-4">
                  合作、建议或问题反馈
                </p>
              </div>
              <a
                href="mailto:1146850129@qq.com"
                className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline"
              >
                1146850129@qq.com
                <Icon name="arrow_forward" className="text-sm" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Signature */}
      <section className="py-20 px-6">
        <div className="text-center max-w-3xl mx-auto">
          <div className="w-24 h-[1px] bg-outline-variant mx-auto mb-8" />
          <p className="text-4xl italic font-serif mb-4">
            &ldquo;Tools for students, by students.&rdquo;
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            UniSkill Team
          </p>
        </div>
      </section>
    </>
  );
}
