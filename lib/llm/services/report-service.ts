import "server-only";
import { createLLMClient } from "../client";
import {
  REPORT_PROMPTS,
  createCEOReportUserPrompt,
  createHRReportUserPrompt,
  createMarketingReportUserPrompt,
} from "../prompts";

/**
 * 보고서 생성 LLM 서비스
 */
export class ReportService {
  /**
   * CEO 경영 보고서 생성
   */
  static async generateCEOReport(
    hospitalInfo: any,
    ceoData: string
  ): Promise<string> {
    const client = createLLMClient();

    const messages = [
      {
        role: "system" as const,
        content: REPORT_PROMPTS.ceo.system,
      },
      {
        role: "user" as const,
        content: createCEOReportUserPrompt(hospitalInfo, ceoData),
      },
    ];

    const response = await client.chat.completions.create({
      model: REPORT_PROMPTS.ceo.model,
      temperature: REPORT_PROMPTS.ceo.temperature,
      max_tokens: REPORT_PROMPTS.ceo.maxTokens,
      messages,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("보고서 생성 응답이 비어있습니다.");
    }

    return content;
  }

  /**
   * HR 인사관리 보고서 생성
   */
  static async generateHRReport(
    hospitalInfo: any,
    hrData: string,
    hrAnalysis: string
  ): Promise<string> {
    const client = createLLMClient();

    const messages = [
      {
        role: "system" as const,
        content: REPORT_PROMPTS.hr.system,
      },
      {
        role: "user" as const,
        content: createHRReportUserPrompt(hospitalInfo, hrData, hrAnalysis),
      },
    ];

    const response = await client.chat.completions.create({
      model: REPORT_PROMPTS.hr.model,
      temperature: REPORT_PROMPTS.hr.temperature,
      max_tokens: REPORT_PROMPTS.hr.maxTokens,
      messages,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("보고서 생성 응답이 비어있습니다.");
    }

    return content;
  }

  /**
   * 마케팅 보고서 생성
   */
  static async generateMarketingReport(
    hospitalInfo: any,
    marketingData: string,
    marketingAnalysis: string
  ): Promise<string> {
    const client = createLLMClient();

    const messages = [
      {
        role: "system" as const,
        content: REPORT_PROMPTS.marketing.system,
      },
      {
        role: "user" as const,
        content: createMarketingReportUserPrompt(
          hospitalInfo,
          marketingData,
          marketingAnalysis
        ),
      },
    ];

    const response = await client.chat.completions.create({
      model: REPORT_PROMPTS.marketing.model,
      temperature: REPORT_PROMPTS.marketing.temperature,
      max_tokens: REPORT_PROMPTS.marketing.maxTokens,
      messages,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("보고서 생성 응답이 비어있습니다.");
    }

    return content;
  }
}

