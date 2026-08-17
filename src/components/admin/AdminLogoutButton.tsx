"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export function AdminLogoutButton() {
  const t = useTranslations("Admin");
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleLogout}>
      {t("logout")}
    </Button>
  );
}
