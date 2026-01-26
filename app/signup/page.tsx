"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/login";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // 비밀번호 확인 검증
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setError("Supabase 클라이언트를 초기화할 수 없습니다.");
        setLoading(false);
        return;
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("올바른 이메일 형식을 입력해주세요.");
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        setSuccess(true);
        // Supabase 설정에 따라 자동 확인이 활성화되어 있으면 바로 로그인
        // 그렇지 않으면 이메일 확인 메시지 표시
        if (data.session) {
          // 자동 로그인된 경우
          setTimeout(() => {
            router.push("/manager");
            router.refresh();
          }, 1000);
        } else {
          // 이메일 확인이 필요한 경우
          setTimeout(() => {
            router.push(redirectedFrom);
          }, 2000);
        }
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              관리자 회원가입
            </h1>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="font-medium">회원가입 오류</div>
              <div className="mt-1">{error}</div>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <div className="font-medium">회원가입 성공</div>
              <div className="mt-1">
                {email.includes("@") ? (
                  <>
                    회원가입이 완료되었습니다. 이메일 확인 후 로그인해주세요.
                  </>
                ) : (
                  <>회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.</>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || success}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="최소 6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || success}
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || success}
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || success}
              className="w-full h-12 text-base font-semibold"
            >
              {loading ? "가입 중..." : success ? "가입 완료" : "회원가입"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-md border-0 shadow-lg">
            <CardContent className="space-y-6 p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  관리자 회원가입
                </h1>
                <p className="text-sm text-gray-500">로딩 중...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

