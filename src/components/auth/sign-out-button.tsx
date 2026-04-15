"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { createClient } from "@/lib/supabase/client";
import { buildLocalizedPath, type AppLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function SignOutButton({
  locale,
  className = "",
}: {
  locale?: AppLocale;
  className?: string;
}) {
  const router = useRouter();
  const dict = getDictionary(locale ?? "zh");
  const nextLocale = locale ?? "zh";
  const [pending, setPending] = useState(false);

  const handleSignOut = async () => {
    setPending(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push(buildLocalizedPath(nextLocale, "/"));
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className={className}
    >
      <Icon
        name={pending ? "hourglass_top" : "logout"}
        className="text-base"
      />
      {pending ? dict.auth.signOutPending : dict.auth.signOut}
    </button>
  );
}
