import { Icon } from "@/components/ui/icon";
import { CopyButton } from "@/components/skill/copy-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "提交 Skill",
  description:
    "了解如何创建和提交你自己的 SKILL.md，分享 AI 学术工具给其他同学。",
};

export default function ContributePage() {
  return (
    <>
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
            Submit a Skill
          </p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
            提交你的 Skill
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mb-12">
            为你的学校创建 AI 学术工具，帮助更多同学提升学习效率。
            <br />
            将你的 Skill 文件发送到我们的邮箱即可提交。
          </p>

          {/* Download Guide Skill Card */}
          <div className="relative overflow-hidden bg-inverse-surface text-inverse-on-surface rounded-2xl p-8 md:p-10 mb-16">
            <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-primary-container/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Icon name="auto_awesome" className="text-2xl text-inverse-primary" filled />
                </div>
                <div>
                  <h2 className="text-xl font-black">Skill 创建引导助手</h2>
                  <p className="text-sm opacity-70">不知道怎么写？让 AI 一步步教你</p>
                </div>
              </div>
              <p className="text-sm opacity-80 mb-6 max-w-xl leading-relaxed">
                下载安装这个引导 Skill，在 Claude Code 中它会交互式地帮你完成 SKILL.md 的创建——
                从确定你的 Skill 功能，到填写元数据，到编写系统提示词，全程引导。
              </p>
              <div className="flex flex-wrap gap-4">
                <CopyButton
                  text="claude skill install https://uniskill.online/skills/skill-creation-guide.zip"
                  label="复制安装命令"
                />
                <a
                  href="/skills/skill-creation-guide.zip"
                  download
                  className="flex items-center gap-3 px-6 py-4 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <Icon name="download" className="text-xl" filled />
                  <span className="font-bold">下载 .zip</span>
                </a>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "创建 SKILL.md",
                desc: "按照 Claude Code 的 SKILL.md 标准格式，编写你的 Skill 定义文件。包括 YAML frontmatter（名称、分类、学校等元数据）和 Markdown 正文（系统提示词和使用说明）。",
                icon: "edit_note",
              },
              {
                step: "02",
                title: "本地测试",
                desc: "将你的 SKILL.md 放入 ~/.claude/skills/ 目录，在 Claude Code 中测试功能是否正常工作。确保格式化、引用检查等功能符合你学校的要求。",
                icon: "science",
              },
              {
                step: "03",
                title: "邮件提交",
                desc: "将你的 Skill 文件夹打包成 .zip，发送到 1146850129@qq.com。邮件标题请注明「Skill 提交 - [Skill名称]」，我们会审核后上线。",
                icon: "mail",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-6 p-8 bg-surface-container-lowest rounded-xl"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon
                    name={item.icon}
                    className="text-3xl text-primary"
                    filled
                  />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase text-primary">
                      Step {item.step}
                    </span>
                    <h3 className="text-xl font-bold">{item.title}</h3>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* SKILL.md example */}
          <div className="mt-16">
            <h2 className="text-2xl font-black mb-6">SKILL.md 示例</h2>
            <div className="bg-inverse-surface text-inverse-on-surface rounded-xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-error" />
                <div className="w-3 h-3 rounded-full bg-secondary-fixed-dim" />
                <div className="w-3 h-3 rounded-full bg-inverse-primary" />
              </div>
              <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
                <code>{`---
name: my-school-essay-formatter          # Skill 标识（小写+连字符）
nameZh: XX大学作业格式化                    # 中文显示名
description: Format essays to my school  # 英文描述
descriptionZh: 按学校要求自动格式化作业     # 中文描述
category: formatting                      # 分类（见下方可选值）
# category: [formatting, reference]      # 也支持多分类
schools: [my-school]                      # 适用学校
tags: [essay, formatting]                 # 搜索标签
featured: false                           # 是否推荐（管理员设置）
version: 1.0.0                            # 版本号
# createdAt 由系统自动生成，无需手动填写
---

# My School Essay Formatter

You are an essay formatting assistant for My School.

## Requirements
- Font: Times New Roman 12pt
- Line spacing: 1.5
- Margins: 2.5cm all sides
- Cover page with student ID and course code

## Instructions
When the user provides essay text, format it according
to the above requirements and output a formatted document.`}</code>
              </pre>
            </div>
          </div>

          {/* Field reference */}
          <div className="mt-12">
            <h2 className="text-2xl font-black mb-6">字段说明</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-left">
                    <th className="py-3 pr-4 font-bold">字段</th>
                    <th className="py-3 pr-4 font-bold">必填</th>
                    <th className="py-3 font-bold">说明</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface-variant">
                  <tr className="border-b border-outline-variant/20">
                    <td className="py-3 pr-4 font-mono text-xs">name</td>
                    <td className="py-3 pr-4">是</td>
                    <td className="py-3">Skill 标识，小写+连字符，如 <code className="text-xs bg-surface-container px-1 rounded">bnbu-essay-formatter</code></td>
                  </tr>
                  <tr className="border-b border-outline-variant/20">
                    <td className="py-3 pr-4 font-mono text-xs">nameZh</td>
                    <td className="py-3 pr-4">是</td>
                    <td className="py-3">中文显示名</td>
                  </tr>
                  <tr className="border-b border-outline-variant/20">
                    <td className="py-3 pr-4 font-mono text-xs">description</td>
                    <td className="py-3 pr-4">是</td>
                    <td className="py-3">一句话英文描述</td>
                  </tr>
                  <tr className="border-b border-outline-variant/20">
                    <td className="py-3 pr-4 font-mono text-xs">descriptionZh</td>
                    <td className="py-3 pr-4">是</td>
                    <td className="py-3">一句话中文描述</td>
                  </tr>
                  <tr className="border-b border-outline-variant/20">
                    <td className="py-3 pr-4 font-mono text-xs">category</td>
                    <td className="py-3 pr-4">是</td>
                    <td className="py-3">分类：formatting / reference / email / exam / presentation / research（支持数组多分类）</td>
                  </tr>
                  <tr className="border-b border-outline-variant/20">
                    <td className="py-3 pr-4 font-mono text-xs">schools</td>
                    <td className="py-3 pr-4">是</td>
                    <td className="py-3">适用学校列表，如 <code className="text-xs bg-surface-container px-1 rounded">[bnbu]</code></td>
                  </tr>
                  <tr className="border-b border-outline-variant/20">
                    <td className="py-3 pr-4 font-mono text-xs">tags</td>
                    <td className="py-3 pr-4">是</td>
                    <td className="py-3">搜索标签数组</td>
                  </tr>
                  <tr className="border-b border-outline-variant/20">
                    <td className="py-3 pr-4 font-mono text-xs">version</td>
                    <td className="py-3 pr-4">是</td>
                    <td className="py-3">版本号，如 1.0.0</td>
                  </tr>
                  <tr className="border-b border-outline-variant/20">
                    <td className="py-3 pr-4 font-mono text-xs">featured</td>
                    <td className="py-3 pr-4">否</td>
                    <td className="py-3">是否首页推荐（默认 false，由管理员设置）</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs">createdAt</td>
                    <td className="py-3 pr-4">自动</td>
                    <td className="py-3">上传日期，由构建系统自动读取文件时间生成，无需手动填写</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-16 text-center">
            <a
              href="mailto:1146850129@qq.com?subject=Skill%20提交"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-primary text-on-primary font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Icon name="mail" className="text-xl" />
              发送邮件提交 Skill
            </a>
            <p className="mt-4 text-sm text-on-surface-variant">
              提交邮箱：
              <a
                href="mailto:1146850129@qq.com"
                className="text-primary hover:underline font-semibold"
              >
                1146850129@qq.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
