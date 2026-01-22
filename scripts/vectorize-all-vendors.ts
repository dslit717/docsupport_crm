#!/usr/bin/env tsx

/**
 * 모든 업체를 일괄 벡터화하는 스크립트
 *
 * 사용법:
 *   npx tsx scripts/vectorize-all-vendors.ts
 *
 * 또는:
 *   node --loader ts-node/esm scripts/vectorize-all-vendors.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// .env 파일 로드
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("✅ .env 파일 로드 완료\n");
} else {
  console.warn(
    "⚠️  .env 파일을 찾을 수 없습니다. 환경 변수를 직접 설정해주세요.\n"
  );
}

// OpenAI 임베딩 생성 함수
async function createEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.");
    process.exit(1);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API 오류:", error);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("임베딩 생성 오류:", error);
    return null;
  }
}

async function vectorizeAllVendors() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase 환경 변수가 설정되지 않았습니다.");
    console.error("   NEXT_PUBLIC_SUPABASE_URL");
    console.error("   SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("🔍 벡터화되지 않은 업체 조회 중...\n");

  // 벡터화되지 않은 업체 조회
  const { data: vendors, error } = await supabase
    .from("vendors")
    .select(
      `
      id,
      name,
      description_md,
      address,
      city,
      state,
      vendor_category_map (
        vendor_categories (
          name
        )
      )
    `
    )
    .eq("status", "published")
    .is("search_embedding", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ 업체 조회 실패:", error);
    process.exit(1);
  }

  if (!vendors || vendors.length === 0) {
    console.log("✅ 모든 업체가 이미 벡터화되어 있습니다!");
    process.exit(0);
  }

  console.log(`📊 벡터화 대상: ${vendors.length}개 업체\n`);
  console.log("⏳ 벡터화 시작...\n");

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < vendors.length; i++) {
    const vendor = vendors[i];
    const progress = `[${i + 1}/${vendors.length}]`;

    try {
      // 카테고리 이름 추출
      const categoryNames =
        vendor.vendor_category_map
          ?.map((map: any) => map.vendor_categories?.name)
          .filter(Boolean)
          .join(", ") || "";

      // 텍스트 결합
      const embeddingText = [
        vendor.name,
        vendor.description_md || "",
        categoryNames,
        vendor.address || "",
      ]
        .filter(Boolean)
        .join(" ");

      // 임베딩 생성
      const embedding = await createEmbedding(embeddingText);

      if (!embedding || embedding.length === 0) {
        console.error(`${progress} ❌ 임베딩 생성 실패: ${vendor.name}`);
        failCount++;
        continue;
      }

      // 업체 업데이트
      const { error: updateError } = await supabase
        .from("vendors")
        .update({ 
          search_embedding: `[${embedding.join(",")}]`,
          updated_at: new Date().toISOString()
        })
        .eq("id", vendor.id);

      if (updateError) {
        console.error(
          `${progress} ❌ 업데이트 실패 (${vendor.name}):`,
          updateError
        );
        failCount++;
      } else {
        console.log(`${progress} ✅ ${vendor.name}`);
        successCount++;
      }

      // API 제한 방지 (150ms 대기)
      await new Promise((resolve) => setTimeout(resolve, 150));
    } catch (error) {
      console.error(`${progress} ❌ 오류 발생 (${vendor.name}):`, error);
      failCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 벡터화 완료 요약");
  console.log("=".repeat(50));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(
    `📈 성공률: ${((successCount / vendors.length) * 100).toFixed(1)}%`
  );
  console.log("=".repeat(50) + "\n");

  if (successCount > 0) {
    console.log("🎉 벡터 검색이 활성화되었습니다!");
    console.log("   이제 자연어 검색이 가능합니다.\n");
  }
}

// 스크립트 실행
console.log("🚀 업체 일괄 벡터화 스크립트\n");
vectorizeAllVendors()
  .then(() => {
    console.log("✅ 스크립트 실행 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 스크립트 실행 실패:", error);
    process.exit(1);
  });
