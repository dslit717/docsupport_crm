"use client";

import { useCallback, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  const onLoginKakao = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setError("Supabase 클라이언트를 초기화할 수 없습니다.");
        setLoading(false);
        return;
      }

      // 현재 브라우저 origin 사용 (실제 접속 URL)
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      console.log("Starting Kakao OAuth...");
      console.log("Current Origin:", origin);
      console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

      // Supabase Auth를 통한 리다이렉트
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const callbackUrl = `${origin}/auth/callback`;

      // Supabase Auth를 거치는 redirectTo
      const redirectTo = `${supabaseUrl}/auth/v1/callback?redirect_to=${encodeURIComponent(
        callbackUrl
      )}`;

      console.log("Callback URL:", callbackUrl);
      console.log("Full Redirect URL:", redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo,
        },
      });

      console.log("OAuth response:", { data, error });

      if (error) {
        console.error("OAuth error:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      // 성공 시 자동으로 리다이렉트됨
    } catch (e) {
      console.error("Unexpected error:", e);
      setError(
        e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다"
      );
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="space-y-6 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">관리자 로그인</h1>
            <p className="text-sm text-gray-500">카카오 계정으로 로그인하세요</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="font-medium">로그인 오류</div>
              <div className="mt-1 opacity-90">{error}</div>
            </div>
          )}

          <button
            onClick={onLoginKakao}
            disabled={loading}
            className="w-full h-14 rounded-lg font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]"
            style={{
              backgroundColor: '#FEE500',
              color: '#000000',
            }}
          >
            {loading ? (
              <>
                <span>카카오로 이동 중...</span>
              </>
            ) : (
              <>
                <span>카카오 로그인</span>
              </>
            )}
          </button>
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

