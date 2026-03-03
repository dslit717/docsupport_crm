"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface AdminHeaderProps {
  currentPath: string;
}

const navItems = [
  { href: "/manager", label: "대시보드" },
  { href: "/manager/blog", label: "블로그 관리" },
  { href: "/manager/profile-photo", label: "AI 프로필 관리" },
  { href: "/manager/users", label: "유저 관리" },
  { href: "/manager/vendors", label: "업체 관리" },
  { href: "/manager/vendor-categories", label: "업체 카테고리 관리" },
  { href: "/manager/beauty-products", label: "제품 관리" },
  { href: "/manager/beauty-products/images", label: "제품 이미지" },
  { href: "/manager/beauty-product-categories", label: "카테고리 관리" },
  { href: "/manager/advertisement-logs", label: "광고 로그" },
  { href: "/manager/seminars", label: "세미나 관리" },
  { href: "/manager/job-posts", label: "구인게시판 관리" },
  { href: "/manager/clinic-locations", label: "개원자리 관리" },
  { href: "/manager/beauty-product-contacts", label: "제품 연락처 관리" },
  { href: "/manager/contact-products", label: "연락처별 제품 관리" },
  { href: "/manager/login-logs", label: "로그인 로그" },
];

const FIRST_LINE_COUNT = 10;
const EXPANDED_FIRST_LINE_COUNT = 10;

export default function AdminHeader({ currentPath }: AdminHeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [navExpanded, setNavExpanded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex min-h-14 flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
        <Link href="/manager" className="shrink-0 font-bold text-xl">
          관리자
        </Link>

        <div className="category-menu-wrapper ml-auto flex items-center justify-end gap-3">
          <nav
            className={
              "flex items-center gap-x-6 gap-y-2 py-1 justify-start " +
              (navExpanded
                ? "flex-col items-start max-w-5xl"
                : "flex-nowrap overflow-hidden")
            }
          >
            {navExpanded ? (
              <>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {navItems.slice(0, EXPANDED_FIRST_LINE_COUNT).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`shrink-0 text-sm font-medium transition-colors whitespace-nowrap ${
                        currentPath === item.href
                          ? "text-primary"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {navItems.slice(EXPANDED_FIRST_LINE_COUNT).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`shrink-0 text-sm font-medium transition-colors whitespace-nowrap ${
                        currentPath === item.href
                          ? "text-primary"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              navItems.slice(0, FIRST_LINE_COUNT).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 text-sm font-medium transition-colors whitespace-nowrap ${
                    currentPath === item.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              ))
            )}
          </nav>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 rounded-md"
            onClick={() => setNavExpanded((v) => !v)}
            aria-label={navExpanded ? "메뉴 접기" : "메뉴 확장"}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${navExpanded ? "rotate-180" : ""}`}
            />
          </Button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!loading && user && (
            <>
              <span className="text-sm text-muted-foreground">
                {user.user_metadata?.email
                  ? user.user_metadata.email.split("@")[0]
                  : user.email
                    ? user.email.split("@")[0]
                    : "관리자"}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                로그아웃
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
