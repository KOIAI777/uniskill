"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Skill } from "@/types";

const categoryEmoji: Record<string, string> = {
  formatting: "📝",
  reference: "📑",
  email: "📧",
  exam: "📊",
  presentation: "🎤",
  research: "🔍",
};

export function SearchBar({ skills }: { skills: Skill[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const results = query.trim()
    ? skills.filter((s) => {
        const q = query.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.nameZh.includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.descriptionZh.includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
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

  const showDropdown = open && query.trim().length > 0 && mounted;

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
                  key={skill.slug}
                  href={`/skills/${skill.slug}`}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container-low transition-colors"
                >
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">
                      {skill.nameZh}
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
              还有 {results.length - 6} 个结果...
            </div>
          )}
        </>
      ) : (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-on-surface-variant">
            没有找到匹配的 Skill
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
          placeholder="Search for skills (e.g. Essay, Citation...)"
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
      {mounted && dropdown && createPortal(dropdown, document.body)}
    </>
  );
}
