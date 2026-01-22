import "server-only";
import { createLLMClient } from "../client";
import { VENDOR_SEARCH_PROMPTS } from "../prompts";

/**
 * 업체 검색 LLM 서비스
 */
export class VendorSearchService {
  /**
   * 자연어 쿼리를 검색 키워드로 변환
   */
  static async convertQueryToSearchTerms(query: string): Promise<string[]> {
    try {
      const client = createLLMClient();

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: VENDOR_SEARCH_PROMPTS.queryConverter.system,
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: VENDOR_SEARCH_PROMPTS.queryConverter.maxTokens,
        temperature: VENDOR_SEARCH_PROMPTS.queryConverter.temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content || content.trim().length === 0) {
        console.warn("ChatGPT 응답이 비어있음, 원본 쿼리 사용");
        return [query];
      }

      try {
        // JSON 파싱 (마크다운 코드 블록 제거)
        let jsonString = content;

        if (jsonString.includes("```json")) {
          const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonString = jsonMatch[1].trim();
          }
        }

        if (jsonString.includes("```")) {
          const jsonMatch = jsonString.match(/```\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonString = jsonMatch[1].trim();
          }
        }

        const arrayMatch = jsonString.match(/\[[\s\S]*?\]/);
        if (arrayMatch) {
          jsonString = arrayMatch[0];
        }

        const searchQueries = JSON.parse(jsonString);
        if (Array.isArray(searchQueries) && searchQueries.length > 0) {
          // 최대 3개까지만 사용
          return searchQueries
            .slice(0, 3)
            .filter((q) => q && q.trim().length > 0);
        }
      } catch (parseError) {
        console.error("검색 쿼리 파싱 오류:", parseError);
        console.error("원본 응답:", content);
      }

      // 파싱 실패 시 원본 쿼리 사용
      return [query];
    } catch (error) {
      console.error("쿼리 변환 오류:", error);
      return [query]; // 오류 시 원본 쿼리 반환
    }
  }

  /**
   * 업체 적합성 평가 및 점수 부여
   */
  static async scoreVendorRelevance(
    vendors: any[],
    query: string
  ): Promise<any[]> {
    if (!Array.isArray(vendors) || vendors.length === 0) {
      return [];
    }

    try {
      const client = createLLMClient();

      // 업체 정보 간소화 (카테고리 정보 포함)
      const vendorDescriptions = vendors.map((vendor) => {
        const categoryNames =
          vendor.categories?.map((c: any) => c.name).join(", ") || "미지정";

        return {
          id: vendor.id,
          name: vendor.name || "이름 없음",
          description: vendor.description_md || "",
          categories: categoryNames,
          address: vendor.address || "",
          service_areas: vendor.service_areas || "",
          similarity: vendor.similarity || 0,
        };
      });

      // 배치 처리 (10개씩)
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < vendorDescriptions.length; i += batchSize) {
        batches.push(vendorDescriptions.slice(i, i + batchSize));
      }

      let allScores: any[] = [];

      for (const batch of batches) {
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: VENDOR_SEARCH_PROMPTS.relevanceScorer.system,
            },
            {
              role: "user",
              content: `사용자 요청: "${query}"

평가할 업체들:
${JSON.stringify(batch, null, 2)}`,
            },
          ],
          max_tokens: VENDOR_SEARCH_PROMPTS.relevanceScorer.maxTokens,
          temperature: VENDOR_SEARCH_PROMPTS.relevanceScorer.temperature,
        });

        const content = response.choices[0]?.message?.content;
        if (content && content.trim().length > 0) {
          try {
            // JSON 파싱 (마크다운 코드 블록 제거)
            let jsonString = content;

            if (jsonString.includes("```json")) {
              const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
              if (jsonMatch) {
                jsonString = jsonMatch[1].trim();
              }
            }

            if (jsonString.includes("```")) {
              const jsonMatch = jsonString.match(/```\s*([\s\S]*?)\s*```/);
              if (jsonMatch) {
                jsonString = jsonMatch[1].trim();
              }
            }

            const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
              jsonString = arrayMatch[0];
            }

            const scores = JSON.parse(jsonString);
            if (Array.isArray(scores)) {
              allScores.push(...scores);
            }
          } catch (parseError) {
            console.error("배치 점수 파싱 오류:", parseError);
            console.error("원본 응답:", content);
          }
        }
      }

      // 점수가 없는 경우 기본 점수 사용
      if (allScores.length === 0) {
        console.warn(
          "ChatGPT 점수 평가 응답이 비어있음, 유사도 기반 점수 사용"
        );
        return vendors.map((vendor) => ({
          ...vendor,
          relevanceScore: Math.min(10, (vendor.similarity || 0.5) * 10),
          matchReason: "벡터 유사도 기반 추천",
        }));
      }

      // 부적합(unsuitable) 업체 필터링 및 로깅
      const suitableScores = allScores.filter((s: any) => {
        if (s.status === "unsuitable") {
          console.log(
            `❌ 부적합 업체 제외: ${
              vendors.find((v) => v.id === s.vendor_id)?.name || s.vendor_id
            } - ${s.reason}`
          );
          return false;
        }
        return true;
      });

      console.log(
        `적합성 필터링: ${allScores.length}개 → ${suitableScores.length}개 (${
          allScores.length - suitableScores.length
        }개 제외)`
      );

      // 최종 결과 생성 (적합/보류 업체만)
      const results = vendors
        .map((vendor) => {
          const scoreData = suitableScores.find(
            (s: any) => s.vendor_id === vendor.id
          );
          if (!scoreData) {
            // 평가되지 않은 업체는 제외
            return null;
          }
          return {
            ...vendor,
            relevanceScore: Math.max(0, Math.min(10, scoreData.score || 5)),
            matchReason: scoreData.reason || "벡터 유사도 기반 추천",
            status: scoreData.status || "pending",
          };
        })
        .filter(Boolean) as any[];

      return results;
    } catch (error) {
      console.error("점수 평가 오류:", error);
      // 오류 시 유사도 기반 점수 사용
      return vendors.map((vendor) => ({
        ...vendor,
        relevanceScore: Math.min(10, (vendor.similarity || 0.5) * 10),
        matchReason: "벡터 유사도 기반 추천",
      }));
    }
  }
}

