import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createErrorResponse,
  createSuccessResponse,
  parsePaginationParams,
} from "@/lib/server/api-utils";

/**
 * GET: 이미지 관리용 제품 목록 조회
 * 
 * beauty_product_detail 뷰를 활용하여 빠른 조회
 * 활성화된 제품만 반환
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = request.nextUrl;
    
    const { page, limit } = parsePaginationParams(searchParams);
    const search = searchParams.get("search") || "";
    
    const offset = (page - 1) * limit;

    // beauty_product_detail 뷰에서 활성화된 제품만 조회
    let query = supabase
      .from("beauty_product_detail")
      .select("id, ProductID, ProductName, ProductNameEN, ProductManufacturer, ProductDetailImage, is_active", { count: "exact" })
      .eq("is_active", true)
      .order("ProductID", { ascending: true });

    // 검색어 필터
    if (search) {
      query = query.or(`ProductName.ilike.%${search}%,ProductNameEN.ilike.%${search}%,ProductManufacturer.ilike.%${search}%`);
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("제품 목록 조회 오류:", error);
      return createErrorResponse(error, 500, "제품 목록 조회 오류");
    }

    // 프론트엔드 형식에 맞게 변환
    const products = (data || []).map((p) => ({
      id: p.id,
      product_id: p.ProductID,
      name: p.ProductName,
      name_en: p.ProductNameEN,
      brand: p.ProductManufacturer,
      image_name: p.ProductDetailImage,
      is_active: p.is_active,
    }));

    return NextResponse.json({
      success: true,
      data: products,
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("제품 목록 조회 오류:", error);
    return createErrorResponse(error, 500, "제품 목록 조회 오류");
  }
}

/**
 * POST: 제품 이미지 업로드/교체
 *
 * 제품 이미지를 업로드하고 기존 이미지가 있으면 교체합니다.
 * 이미지는 product_imgs 버킷에 고유 파일명으로 저장되고,
 * beauty_products 테이블의 ProductDetailImage 필드에 파일명이 저장됩니다.
 * 
 * Storage 작업은 Admin(service_role) 키로만 가능합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log("[이미지 업로드] Service Role Key 설정됨:", hasServiceKey);
    
    if (!hasServiceKey) {
      return createErrorResponse(
        new Error("SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다."),
        500
      );
    }

    // Admin 클라이언트 사용 (service_role 키로 RLS 우회)
    const supabase = createSupabaseAdminClient();
    console.log("[이미지 업로드] Admin 클라이언트 생성 완료");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const productId = formData.get("product_id") as string; // beauty_products.id (UUID)
    
    console.log("[이미지 업로드] 요청 데이터:", { 
      fileName: file?.name, 
      fileSize: file?.size, 
      productId 
    });

    // 유효성 검사
    if (!file) {
      return createErrorResponse(
        new Error("파일이 제공되지 않았습니다."),
        400
      );
    }

    if (!productId) {
      return createErrorResponse(
        new Error("제품 ID가 필요합니다."),
        400
      );
    }

    // 파일 확장자 확인
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      return createErrorResponse(
        new Error("지원하지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp만 가능)"),
        400
      );
    }

    // 파일 크기 확인 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      return createErrorResponse(
        new Error("파일 크기는 5MB 이하여야 합니다."),
        400
      );
    }

    // 현재 제품 정보 조회 (기존 이미지 확인)
    const { data: product, error: productError } = await supabase
      .from("beauty_products")
      .select("id, ProductDetailImage")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return createErrorResponse(
        new Error("제품을 찾을 수 없습니다."),
        404
      );
    }

    // 파일명: {제품UUID}.{원본확장자}
    const fileName = `${productId}.${fileExt}`;

    // 기존 이미지가 있으면 삭제
    if (product.ProductDetailImage) {
      await supabase.storage.from("product_imgs").remove([product.ProductDetailImage]);
    }

    // Content-Type 결정
    const contentTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    const contentType = contentTypeMap[fileExt] || "image/jpeg";

    console.log("[이미지 업로드] Storage 업로드 시작:", { fileName, contentType });
    
    // 이미지 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product_imgs")
      .upload(fileName, file, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage 업로드 오류:", {
        message: uploadError.message,
        name: uploadError.name,
        cause: uploadError.cause,
        stack: uploadError.stack,
        fullError: JSON.stringify(uploadError),
      });
      return createErrorResponse(uploadError, 400, "파일 업로드 오류");
    }
    
    console.log("[이미지 업로드] Storage 업로드 성공:", uploadData);

    // DB에 이미지 파일명 저장
    const { error: updateError } = await supabase
      .from("beauty_products")
      .update({ ProductDetailImage: fileName })
      .eq("id", productId);

    if (updateError) {
      // 업로드된 파일 롤백
      await supabase.storage.from("product_imgs").remove([fileName]);
      console.error("DB 업데이트 오류:", updateError);
      return createErrorResponse(updateError, 500, "이미지 정보 저장 오류");
    }

    // 업로드된 이미지의 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from("product_imgs")
      .getPublicUrl(fileName);

    return createSuccessResponse({
      message: "이미지가 성공적으로 업로드되었습니다.",
      path: uploadData.path,
      url: publicUrlData.publicUrl,
      fileName: fileName,
      productId: productId,
    }, 201);
  } catch (error) {
    console.error("이미지 업로드 오류:", error);
    return createErrorResponse(error, 500, "이미지 업로드 오류");
  }
}

/**
 * DELETE: 제품 이미지 삭제
 * 
 * Storage 작업은 Admin(service_role) 키로만 가능합니다.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Admin 클라이언트 사용 (service_role 키로 RLS 우회)
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id"); // beauty_products.id (UUID)

    if (!productId) {
      return createErrorResponse(
        new Error("제품 ID가 필요합니다."),
        400
      );
    }

    // 현재 제품의 이미지 파일명 조회
    const { data: product, error: productError } = await supabase
      .from("beauty_products")
      .select("id, ProductDetailImage")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return createErrorResponse(
        new Error("제품을 찾을 수 없습니다."),
        404
      );
    }

    if (!product.ProductDetailImage) {
      return createErrorResponse(
        new Error("삭제할 이미지가 없습니다."),
        400
      );
    }

    // Storage에서 파일 삭제
    const { error: storageError } = await supabase.storage
      .from("product_imgs")
      .remove([product.ProductDetailImage]);

    if (storageError) {
      console.error("Storage 삭제 오류:", storageError);
      return createErrorResponse(storageError, 400, "이미지 삭제 오류");
    }

    // DB에서 이미지 필드 초기화
    const { error: updateError } = await supabase
      .from("beauty_products")
      .update({ ProductDetailImage: null })
      .eq("id", productId);

    if (updateError) {
      console.error("DB 업데이트 오류:", updateError);
      return createErrorResponse(updateError, 500, "이미지 정보 삭제 오류");
    }

    return NextResponse.json({ 
      message: "이미지가 삭제되었습니다.",
      productId: productId,
    });
  } catch (error) {
    console.error("이미지 삭제 오류:", error);
    return createErrorResponse(error, 500, "이미지 삭제 오류");
  }
}

