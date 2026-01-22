"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface AdminHeaderProps {
  currentPath: string;
}

export default function AdminHeader({ currentPath }: AdminHeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 현재 사용자 정보 가져오기
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // 인증 상태 변화 감지
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

  const navItems = [
    { href: "/manager/users", label: "유저 관리" },
    { href: "/manager/vendors", label: "업체 관리" },
    { href: "/manager/vendor-categories", label: "업체 카테고리 관리" },
    { href: "/manager/advertisement-logs", label: "광고 로그" },
    { href: "/manager/beauty-products", label: "제품 관리" },
    { href: "/manager/beauty-products/images", label: "제품 이미지" },
    { href: "/manager/beauty-product-categories", label: "카테고리 관리" },
    { href: "/manager/seminars", label: "세미나 관리" },
    { href: "/manager/job-posts", label: "구인게시판 관리" },
    { href: "/manager/clinic-locations", label: "개원자리 관리" },
    { href: "/manager/beauty-product-contacts", label: "제품 연락처 관리" },
    { href: "/manager/contact-products", label: "연락처별 제품 관리" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <div className="mr-4 flex">
          <Link href="/manager" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">관리자</span>
          </Link>
        </div>

        <nav className="flex items-center space-x-6 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                currentPath === item.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!loading && user && (
            <>
              <span className="text-sm text-muted-foreground">
                {user.email || user.user_metadata?.email || "사용자"}
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
