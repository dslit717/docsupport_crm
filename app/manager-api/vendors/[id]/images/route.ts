import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/server/api-utils";

// GET: 업체의 이미지 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("vendor_images")
      .select("*")
      .eq("vendor_id", id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[이미지 목록 조회 오류]", error);
      return NextResponse.json(
        {
          success: false,
          error: "이미지 목록 조회 오류",
          details: error.message,
          code: error.code,
        },
        { status: 400 }
      );
    }

    return createSuccessResponse(data);
  } catch (error: any) {
    console.error("[이미지 목록 조회 예외]", error);
    return NextResponse.json(
      {
        success: false,
        error: "이미지 목록 조회 오류",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

// POST: 새 이미지 업로드
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { id: vendorId } = await params;

    console.log("[이미지 업로드 시작]", { vendorId });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const altText = formData.get("alt_text") as string;
    const isPrimary = formData.get("is_primary") === "true";
    const sortOrder = parseInt(formData.get("sort_order") as string) || 0;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "파일이 제공되지 않았습니다.",
          code: "NO_FILE",
        },
        { status: 400 }
      );
    }

    console.log("[업로드 파일 정보]", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // 파일 확장자 확인
    const fileExt = file.name.split(".").pop();
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];

    if (!fileExt || !allowedExtensions.includes(fileExt.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: "지원하지 않는 파일 형식입니다.",
          details: `허용된 형식: ${allowedExtensions.join(", ")}`,
          code: "INVALID_FILE_TYPE",
        },
        { status: 400 }
      );
    }

    // 파일 크기 확인 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "파일 크기는 10MB 이하여야 합니다.",
          details: `현재 파일 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
          code: "FILE_TOO_LARGE",
        },
        { status: 400 }
      );
    }

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${vendorId}/${timestamp}_${randomString}.${fileExt}`;

    console.log("[Storage 업로드 시작]", { fileName, bucket: "vendor_images" });

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vendor_images")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[Storage 업로드 오류]", uploadError);
      return NextResponse.json(
        {
          success: false,
          error: "파일 업로드 오류",
          details: uploadError.message,
          code: "STORAGE_UPLOAD_ERROR",
          debug: {
            fileName,
            fileSize: file.size,
            fileType: file.type,
          },
        },
        { status: 400 }
      );
    }

    console.log("[Storage 업로드 성공]", { path: uploadData.path });

    // isPrimary가 true면 다른 이미지들의 is_primary를 false로 설정
    if (isPrimary) {
      const { error: updateError } = await supabase
        .from("vendor_images")
        .update({ is_primary: false })
        .eq("vendor_id", vendorId);
      
      if (updateError) {
        console.error("[Primary 업데이트 오류]", updateError);
      }
    }

    // 데이터베이스에 이미지 정보 저장
    const { data: imageData, error: imageError } = await supabase
      .from("vendor_images")
      .insert({
        vendor_id: vendorId,
        storage_path: uploadData.path,
        alt_text: altText || null,
        is_primary: isPrimary,
        sort_order: sortOrder,
        status: "approved",
      })
      .select()
      .single();

    if (imageError) {
      console.error("[DB 저장 오류]", imageError);
      // 업로드된 파일 삭제
      await supabase.storage.from("vendor_images").remove([fileName]);
      return NextResponse.json(
        {
          success: false,
          error: "이미지 정보 저장 오류",
          details: imageError.message,
          code: imageError.code,
          hint: imageError.hint,
        },
        { status: 400 }
      );
    }

    console.log("[이미지 업로드 완료]", { imageId: imageData.id });

    return createSuccessResponse(imageData, 201);
  } catch (error: any) {
    console.error("[이미지 업로드 예외]", error);
    return NextResponse.json(
      {
        success: false,
        error: "이미지 업로드 오류",
        details: error?.message || String(error),
        code: "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}

// DELETE: 이미지 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("image_id");

    console.log("[이미지 삭제 시작]", { imageId });

    if (!imageId) {
      return NextResponse.json(
        {
          success: false,
          error: "이미지 ID가 필요합니다.",
          code: "NO_IMAGE_ID",
        },
        { status: 400 }
      );
    }

    // 이미지 정보 조회
    const { data: imageData, error: fetchError } = await supabase
      .from("vendor_images")
      .select("storage_path")
      .eq("id", imageId)
      .single();

    if (fetchError || !imageData) {
      console.error("[이미지 조회 오류]", fetchError);
      return NextResponse.json(
        {
          success: false,
          error: "이미지를 찾을 수 없습니다.",
          details: fetchError?.message,
          code: fetchError?.code || "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    console.log("[Storage 삭제 시작]", { path: imageData.storage_path });

    // Storage에서 파일 삭제
    const { error: storageError } = await supabase.storage
      .from("vendor_images")
      .remove([imageData.storage_path]);

    if (storageError) {
      console.error("[Storage 삭제 오류]", storageError);
      // Storage 삭제 실패해도 DB 레코드는 삭제 진행
    }

    // 데이터베이스에서 이미지 정보 삭제
    const { error: deleteError } = await supabase
      .from("vendor_images")
      .delete()
      .eq("id", imageId);

    if (deleteError) {
      console.error("[DB 삭제 오류]", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "이미지 삭제 오류",
          details: deleteError.message,
          code: deleteError.code,
        },
        { status: 400 }
      );
    }

    console.log("[이미지 삭제 완료]", { imageId });

    return NextResponse.json({ success: true, message: "이미지가 삭제되었습니다." });
  } catch (error: any) {
    console.error("[이미지 삭제 예외]", error);
    return NextResponse.json(
      {
        success: false,
        error: "이미지 삭제 오류",
        details: error?.message || String(error),
        code: "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
