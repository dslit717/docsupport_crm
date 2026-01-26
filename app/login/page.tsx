"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/manager";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setError("Supabase 클라이언트를 초기화할 수 없습니다.");
        setLoading(false);
        return;
      }

      // 아이디를 이메일 형식으로 변환 (Supabase는 이메일 형식이 필요)
      // admin -> admin@test.com
      const emailToUse = username.includes("@") 
        ? username 
        : `${username}@test.com`;

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (signInError) {
        // 에러 메시지를 더 명확하게 표시
        if (signInError.message.includes("Invalid login credentials") || signInError.code === "invalid_credentials") {
          setError("이메일 또는 비밀번호가 올바르지 않습니다. 회원가입 시 사용한 이메일 주소를 정확히 입력해주세요.");
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.");
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        // 로그인 성공 시 리다이렉트
        router.push(redirectedFrom);
        router.refresh();
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다"
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="space-y-6 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">관리자 로그인</h1>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="font-medium">로그인 오류</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                type="text"
                placeholder="이메일 또는 아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold"
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            계정이 없으신가요?{" "}
            <Link
              href="/signup"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              회원가입
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-md border-0 shadow-lg">
            <CardContent className="space-y-6 p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">관리자 로그인</h1>
                <p className="text-sm text-gray-500">로딩 중...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

