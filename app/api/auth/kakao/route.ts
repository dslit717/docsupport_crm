import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  // 요청 origin 가져오기
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  console.log("Kakao OAuth API - Request Origin:", origin);

  // Supabase Auth를 통한 콜백 URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const callbackUrl = `${origin}/auth/callback`;
  const redirectTo = `${supabaseUrl}/auth/v1/callback?redirect_to=${encodeURIComponent(
    callbackUrl
  )}`;

  console.log("Kakao OAuth API - Callback URL:", callbackUrl);
  console.log("Kakao OAuth API - Full Redirect:", redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error("Kakao OAuth API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.redirect(data.url);
}

