"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Category } from "@/types";

const categoryEmoji: Record<string, string> = {
  formatting: "📝",
  reference: "📑",
  email: "📧",
  exam: "📊",
  presentation: "🎤",
  research: "🔍",
};

export interface SearchBarSkill {
  slug: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  category: Category | Category[];
  tags: string[];
  version: string;
  href: string;
  sourceLabel?: string;
}

interface SearchBarMessages {
  placeholder: string;
  noResults: string;
  moreResults: string;
}

const defaultMessages: SearchBarMessages = {
  placeholder: "Search for skills (e.g. Essay, Citation...)",
  noResults: "没有找到匹配的 Skill",
  moreResults: "还有 {count} 个结果...",
};

function scoreSearchResult(skill: SearchBarSkill, rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();

  if (!query) {
    return 0;
  }

  const name = skill.name.toLowerCase();
  const nameZh = skill.nameZh.toLowerCase();
  const description = skill.description.toLowerCase();
  const descriptionZh = skill.descriptionZh.toLowerCase();
  const tags = skill.tags.map((tag) => tag.toLowerCase());

  let score = 0;

  if (name === query) score += 1000;
  if (nameZh === query) score += 1000;

  if (name.startsWith(query)) score += 700;
  if (nameZh.startsWith(query)) score += 700;

  if (tags.some((tag) => tag === query)) score += 650;
  if (tags.some((tag) => tag.startsWith(query))) score += 500;

  if (name.includes(query)) score += 320;
  if (nameZh.includes(query)) score += 320;

  if (tags.some((tag) => tag.includes(query))) score += 220;

  if (description.startsWith(query)) score += 120;
  if (descriptionZh.startsWith(query)) score += 120;

  if (description.includes(query)) score += 60;
  if (descriptionZh.includes(query)) score += 60;

  return score;
}

export function SearchBar({
  skills,
  messages = defaultMessages,
}: {
  skills: SearchBarSkill[];
  messages?: SearchBarMessages;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const results = query.trim()
    ? skills
        .map((skill) => ({
          skill,
          score: scoreSearchResult(skill, query),
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }

          return a.skill.nameZh.length - b.skill.nameZh.length;
        })
        .map(({ skill }) => skill)
    : [];

  const updatePos = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open, updatePos]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        inputRef.current && !inputRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isBrowser = typeof window !== "undefined";
  const showDropdown = open && query.trim().length > 0 && isBrowser;

  const dropdown = showDropdown ? (
    <div
      ref={dropdownRef}
      className="rounded-xl shadow-[0px_10px_40px_rgba(25,28,30,0.15)] border border-outline-variant/20 overflow-hidden animate-page-in"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: pos.width,
        background: "#ffffff",
        zIndex: 9999,
      }}
    >
      {results.length > 0 ? (
        <>
          <div className="max-h-80 overflow-y-auto">
            {results.slice(0, 6).map((skill) => {
              const emoji =
                categoryEmoji[
                  Array.isArray(skill.category)
                    ? skill.category[0]
                    : skill.category
                ] || "📦";
              return (
                <Link
                  key={`${skill.href}:${skill.slug}`}
                  href={skill.href}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container-low transition-colors"
                >
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="font-bold text-sm truncate">
                        {skill.nameZh}
                      </div>
                      {skill.sourceLabel && (
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant">
                          {skill.sourceLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-on-surface-variant truncate">
                      {skill.descriptionZh || skill.description}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-[10px] text-outline">
                    v{skill.version}
                  </div>
                </Link>
              );
            })}
          </div>
          {results.length > 6 && (
            <div className="px-5 py-3 text-xs text-on-surface-variant border-t border-outline-variant/20 text-center">
              {messages.moreResults.replace("{count}", String(results.length - 6))}
            </div>
          )}
        </>
      ) : (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-on-surface-variant">
            {messages.noResults}
          </p>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <div className="relative max-w-2xl group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Icon name="search" className="text-outline" />
        </div>
        <input
          ref={inputRef}
          className="w-full pl-14 pr-6 py-5 bg-surface-container-lowest border-none rounded-xl text-lg shadow-sm focus:ring-2 focus:ring-primary transition-all duration-300 placeholder:text-outline-variant"
          placeholder={messages.placeholder}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            updatePos();
          }}
          onFocus={() => {
            if (query.trim()) setOpen(true);
            updatePos();
          }}
        />
      </div>
      {isBrowser && dropdown && createPortal(dropdown, document.body)}
    </>
  );
}
