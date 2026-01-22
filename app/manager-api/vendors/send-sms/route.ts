import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/server/api-utils";

// Solapi 설정
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "NCSKL8P2ZZMU7EHC";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "G8BY615Z66FXBLGWY1UJCLRZANJ8AWYS";
const FROM_NUMBER = process.env.LMS_FROM_NUMBER || "01081720061"; // 발신자 번호

// 메시지 템플릿 생성
function createPartnerMessage(vendorName: string, description: string, vendorId: string): string {
  return `(광고)닥터서포트 파트너 문자입니다. 
  
  ${vendorName}님 안녕하세요.

대한민국 20만 개원의사 플랫폼 닥터서포트입니다. 닥터서포트는 여러 파트너사들과 원장님들을 연결해드리기 위해 힘쓰고 있습니다.

본사이트에 저장된 귀 사의 정보는

${description || "(등록된 정보 없음)"}

와 같으며

더 나은 정보제공을 위해 업데이트를 진행하시면 더 많은 개원의사 선생님들께 전달될 수 있습니다.

많은 참여를 부탁드립니다.

상세보기링크 : https://docsupport.kr/partners/${vendorId}`;
}

// POST: 파트너 문자 전송 (Solapi 직접 호출)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();

    const { vendor_id, to_number } = body;

    if (!vendor_id) {
      return createErrorResponse(new Error("vendor_id가 필요합니다."), 400);
    }

    if (!to_number) {
      return createErrorResponse(new Error("수신자 번호(to_number)가 필요합니다."), 400);
    }

    // 업체 정보 조회
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, name, description_md, phone, mobile")
      .eq("id", vendor_id)
      .single();

    if (vendorError || !vendor) {
      return createErrorResponse(
        new Error("업체를 찾을 수 없습니다."),
        404,
        vendorError?.message
      );
    }

    // 메시지 생성
    const message = createPartnerMessage(vendor.name, vendor.description_md || "", vendor.id);
    const toNumberClean = to_number.replace(/-/g, ""); // 하이픈 제거

    console.log("[Solapi LMS 전송 시작]", {
      vendor_id,
      vendor_name: vendor.name,
      to_number: toNumberClean,
      from_number: FROM_NUMBER,
      message_length: message.length,
      detail_link: `https://docsupport.kr/partners/${vendor.id}`,
    });

    // Solapi 직접 호출
    try {
      // Dynamic import for Solapi (서버 사이드에서만 실행)
      const { SolapiMessageService } = await import("solapi");
      
      const messageService = new SolapiMessageService(
        SOLAPI_API_KEY,
        SOLAPI_API_SECRET
      );

      const result = await messageService.send({
        to: toNumberClean,
        from: FROM_NUMBER,
        text: message,
      });

      console.log("[Solapi LMS 전송 성공]", {
        vendor_id,
        vendor_name: vendor.name,
        to_number: toNumberClean,
        result,
      });

      return createSuccessResponse({
        message: "파트너 문자가 성공적으로 전송되었습니다.",
        vendor_name: vendor.name,
        to_number: toNumberClean,
        solapi_result: result,
      });
    } catch (solapiError: any) {
      console.error("[Solapi LMS 전송 실패]", solapiError);

      // Solapi 에러 상세 정보 추출
      const errorInfo = {
        name: solapiError?.name,
        message: solapiError?.message,
        code: solapiError?.code,
        statusCode: solapiError?.statusCode,
        errorCode: solapiError?.errorCode,
      };

      return NextResponse.json(
        {
          success: false,
          error: "문자 전송 실패",
          details: solapiError?.message || "Solapi API 오류가 발생했습니다.",
          code: solapiError?.errorCode || solapiError?.code || "SOLAPI_ERROR",
          debug: errorInfo,
        },
        { status: solapiError?.statusCode || 500 }
      );
    }
  } catch (error: any) {
    console.error("[LMS 전송 오류]", error);
    return NextResponse.json(
      {
        success: false,
        error: "파트너 문자 전송 오류",
        details: error?.message || String(error),
        code: "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}

// GET: 미리보기 메시지 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendor_id");

    if (!vendorId) {
      return createErrorResponse(new Error("vendor_id가 필요합니다."), 400);
    }

    // 업체 정보 조회
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, name, description_md, phone, mobile")
      .eq("id", vendorId)
      .single();

    if (vendorError || !vendor) {
      return createErrorResponse(
        new Error("업체를 찾을 수 없습니다."),
        404,
        vendorError?.message
      );
    }

    // 메시지 미리보기 생성
    const previewMessage = createPartnerMessage(vendor.name, vendor.description_md || "", vendor.id);

    return createSuccessResponse({
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      phone: vendor.phone,
      mobile: vendor.mobile,
      preview_message: previewMessage,
      detail_link: `https://docsupport.kr/partners/${vendor.id}`,
    });
  } catch (error: any) {
    return createErrorResponse(error, 500, "미리보기 조회 오류");
  }
}
