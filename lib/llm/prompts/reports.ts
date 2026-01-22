/**
 * 보고서 생성 관련 프롬프트
 */

export const REPORT_PROMPTS = {
  /**
   * CEO 경영 보고서
   */
  ceo: {
    system: `당신은 의료기관 경영 컨설턴트입니다. 주어진 정보를 바탕으로 CEO를 위한 종합적인 경영 보고서를 작성해주세요.

보고서 형식:
1. 경영 현황 요약
2. 운영 효율성 분석
3. 재무 성과 분석
4. 리스크 및 기회 요인
5. 전략적 제안 및 액션 플랜

보고서는 CEO가 중요한 경영 의사결정을 내릴 수 있도록 구체적이고 실행 가능한 내용으로 작성해주세요.`,
    
    maxTokens: 2000,
    temperature: 0.7,
    model: "gpt-4",
  },

  /**
   * HR 인사관리 보고서
   */
  hr: {
    system: `당신은 병원 인사관리 전문가입니다. 주어진 정보를 바탕으로 실용적이고 구체적인 HR 보고서를 작성해주세요.

보고서 형식:
1. 인력 현황 요약
2. 조직 구성 분석
3. 인사관리 현황
4. 직원 만족도 및 이직률 분석
5. 개선 제안 및 액션 플랜

보고서는 병원 경영진이 즉시 실행할 수 있는 구체적인 내용으로 작성해주세요.`,
    
    maxTokens: 2000,
    temperature: 0.7,
    model: "gpt-4",
  },

  /**
   * 마케팅 보고서
   */
  marketing: {
    system: `당신은 병원 마케팅 전문가입니다. 주어진 정보를 바탕으로 실용적이고 구체적인 마케팅 보고서를 작성해주세요.

보고서 형식:
1. 마케팅 현황 요약
2. 디지털 마케팅 분석
3. 경쟁 분석
4. ROI 분석
5. 개선 제안 및 액션 플랜

보고서는 병원 경영진이 즉시 실행할 수 있는 구체적인 내용으로 작성해주세요.`,
    
    maxTokens: 2000,
    temperature: 0.7,
    model: "gpt-4",
  },
} as const;

/**
 * 보고서용 사용자 프롬프트 생성 헬퍼
 */
export function createCEOReportUserPrompt(hospitalInfo: any, ceoData: string): string {
  return `다음 정보를 바탕으로 CEO 보고서를 작성해주세요:

병원 정보:
- 병원명: ${hospitalInfo.name}
- 주소: ${hospitalInfo.address}
- 병원 유형: ${hospitalInfo.type}
- 진료과목: ${hospitalInfo.departments ? hospitalInfo.departments.join(", ") : "종합진료"}
- 병상 수: ${hospitalInfo.beds || "N/A"}
- 의사 수: ${hospitalInfo.doctors || "N/A"}

CEO 데이터:
${ceoData}`;
}

export function createHRReportUserPrompt(hospitalInfo: any, hrData: string, hrAnalysis: string): string {
  return `다음 정보를 바탕으로 HR 보고서를 작성해주세요:

병원 정보:
- 병원명: ${hospitalInfo.name}
- 주소: ${hospitalInfo.address}
- 병원 유형: ${hospitalInfo.type}
- 진료과목: ${hospitalInfo.departments ? hospitalInfo.departments.join(", ") : "종합진료"}
- 의사 수: ${hospitalInfo.doctors || "N/A"}

HR 데이터:
${hrData}

HR 분석:
${hrAnalysis}`;
}

export function createMarketingReportUserPrompt(
  hospitalInfo: any,
  marketingData: string,
  marketingAnalysis: string
): string {
  return `다음 정보를 바탕으로 마케팅 보고서를 작성해주세요:

병원 정보:
- 병원명: ${hospitalInfo.name}
- 주소: ${hospitalInfo.address}
- 병원 유형: ${hospitalInfo.type}
- 진료과목: ${hospitalInfo.departments ? hospitalInfo.departments.join(", ") : "종합진료"}

마케팅 데이터:
${marketingData}

마케팅 분석:
${marketingAnalysis}`;
}

