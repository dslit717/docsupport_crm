export interface YoutubeChannelInfo {
  channelName: string;
  subscriberCount: string;
  description: string;
  thumbnailUrl: string;
  channelUrl: string;
  videoCount?: string;
  viewCount?: string;
}

export interface YoutubeAnalysisResult {
  channelInfo: YoutubeChannelInfo;
  error?: string;
}

/**
 * 유튜브 URL에서 채널 ID 또는 핸들을 추출합니다.
 */
export function extractYoutubeChannelInfo(
  url: string
): { type: "channel" | "handle" | "user" | "c"; id: string } | null {
  try {
    const urlObj = new URL(url);

    // 지원하는 도메인 확인
    if (
      !["www.youtube.com", "youtube.com", "m.youtube.com"].includes(
        urlObj.hostname
      )
    ) {
      return null;
    }

    const pathname = urlObj.pathname;

    // @handle 형태 (예: youtube.com/@channelname)
    if (pathname.startsWith("/@")) {
      return { type: "handle", id: pathname.substring(2) };
    }

    // /channel/UC... 형태
    if (pathname.startsWith("/channel/")) {
      return { type: "channel", id: pathname.substring(9) };
    }

    // /c/channelname 형태
    if (pathname.startsWith("/c/")) {
      return { type: "c", id: pathname.substring(3) };
    }

    // /user/username 형태
    if (pathname.startsWith("/user/")) {
      return { type: "user", id: pathname.substring(6) };
    }

    return null;
  } catch (error) {
    console.error("Error parsing YouTube URL:", error);
    return null;
  }
}

/**
 * 유튜브 URL이 유효한지 확인합니다.
 */
export function isValidYoutubeUrl(url: string): boolean {
  return extractYoutubeChannelInfo(url) !== null;
}

/**
 * 유튜브 채널 URL을 정규화합니다.
 */
export function normalizeYoutubeUrl(url: string): string {
  if (!url.startsWith("http")) {
    url = "https://" + url;
  }

  const channelInfo = extractYoutubeChannelInfo(url);
  if (!channelInfo) {
    return url;
  }

  // 모든 URL을 www.youtube.com 형태로 정규화
  switch (channelInfo.type) {
    case "handle":
      return `https://www.youtube.com/@${channelInfo.id}`;
    case "channel":
      return `https://www.youtube.com/channel/${channelInfo.id}`;
    case "c":
      return `https://www.youtube.com/c/${channelInfo.id}`;
    case "user":
      return `https://www.youtube.com/user/${channelInfo.id}`;
    default:
      return url;
  }
}

/**
 * 텍스트에서 숫자와 단위를 추출하여 정규화합니다.
 */
function normalizeCount(text: string): string {
  if (!text) return "정보 없음";

  // 한국어 단위 변환
  const koreanUnits: { [key: string]: string } = {
    만: "K",
    천: "K",
    억: "M",
  };

  let normalized = text;
  for (const [korean, english] of Object.entries(koreanUnits)) {
    normalized = normalized.replace(korean, english);
  }

  return normalized.trim();
}

/**
 * HTML에서 YouTube 채널 정보를 추출합니다.
 */
export function extractChannelInfoFromHtml(
  html: string,
  url: string
): YoutubeChannelInfo {
  const defaultInfo: YoutubeChannelInfo = {
    channelName: "정보 없음",
    subscriberCount: "정보 없음",
    description: "정보 없음",
    thumbnailUrl: "",
    channelUrl: url,
  };

  try {
    // 채널명 추출 (여러 패턴 시도)
    const channelNamePatterns = [
      /"channelMetadataRenderer"[^}]*"title":\s*"([^"]+)"/,
      /<meta\s+property="og:title"\s+content="([^"]+)"/,
      /<title>([^<]+)<\/title>/,
      /"header"[^}]*"channelHeaderRenderer"[^}]*"title":\s*"([^"]+)"/,
    ];

    for (const pattern of channelNamePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        defaultInfo.channelName = match[1].replace(" - YouTube", "").trim();
        break;
      }
    }

    // 구독자 수 추출
    const subscriberPatterns = [
      /"subscriberCountText"[^}]*"simpleText":\s*"([^"]+)"/,
      /"subscriberCountText"[^}]*"runs"[^}]*"text":\s*"([^"]+)"/,
      /구독자\s*([0-9만천억.]+명?)/,
      /subscribers?\s*([0-9KM.]+)/i,
    ];

    for (const pattern of subscriberPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        defaultInfo.subscriberCount = normalizeCount(match[1]);
        break;
      }
    }

    // 채널 설명 추출
    const descriptionPatterns = [
      /"description"[^}]*"simpleText":\s*"([^"]+)"/,
      /<meta\s+property="og:description"\s+content="([^"]+)"/,
      /<meta\s+name="description"\s+content="([^"]+)"/,
    ];

    for (const pattern of descriptionPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        defaultInfo.description = match[1].substring(0, 200).trim();
        break;
      }
    }

    // 썸네일 이미지 추출
    const thumbnailPatterns = [
      /"avatar"[^}]*"thumbnails"[^}]*"url":\s*"([^"]+)"/,
      /<meta\s+property="og:image"\s+content="([^"]+)"/,
      /"channelHeaderRenderer"[^}]*"avatar"[^}]*"url":\s*"([^"]+)"/,
    ];

    for (const pattern of thumbnailPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        defaultInfo.thumbnailUrl = match[1]
          .replace(/\\u[\d\w]{4}/g, "")
          .replace(/\\/g, "");
        break;
      }
    }

    // 비디오 수 추출
    const videoCountPattern =
      /"videosCountText"[^}]*"runs"[^}]*"text":\s*"([^"]+)"/;
    const videoMatch = html.match(videoCountPattern);
    if (videoMatch && videoMatch[1]) {
      defaultInfo.videoCount = normalizeCount(videoMatch[1]);
    }

    return defaultInfo;
  } catch (error) {
    console.error("Error extracting channel info from HTML:", error);
    return defaultInfo;
  }
}

/**
 * 유튜브 채널 분석 결과를 생성합니다.
 */
export function generateYoutubeAnalysis(
  channelInfo: YoutubeChannelInfo
): string {
  let analysis = `유튜브 채널 "${channelInfo.channelName}" 분석 결과:\n\n`;

  analysis += `📊 기본 정보:\n`;
  analysis += `- 채널명: ${channelInfo.channelName}\n`;
  analysis += `- 구독자 수: ${channelInfo.subscriberCount}\n`;
  if (channelInfo.videoCount) {
    analysis += `- 동영상 수: ${channelInfo.videoCount}\n`;
  }
  analysis += `- 채널 설명: ${channelInfo.description}\n\n`;

  // 구독자 수 기반 분석
  const subscriberText = channelInfo.subscriberCount.toLowerCase();
  analysis += `💡 분석 인사이트:\n`;

  if (
    subscriberText.includes("k") ||
    subscriberText.includes("천") ||
    subscriberText.includes("만")
  ) {
    if (
      subscriberText.includes("만") ||
      (subscriberText.includes("k") && parseInt(subscriberText) >= 10)
    ) {
      analysis += `- 중간 규모의 채널로 안정적인 구독자층을 보유하고 있습니다.\n`;
      analysis += `- 정기적인 콘텐츠 업로드와 구독자와의 소통이 중요합니다.\n`;
    } else {
      analysis += `- 성장 단계의 채널입니다. 꾸준한 콘텐츠 제작이 필요합니다.\n`;
      analysis += `- SEO 최적화와 썸네일 개선을 통해 노출을 늘려보세요.\n`;
    }
  } else if (subscriberText.includes("m") || subscriberText.includes("억")) {
    analysis += `- 대규모 채널로 강력한 영향력을 가지고 있습니다.\n`;
    analysis += `- 브랜드 협업과 광고 수익 최적화에 집중할 수 있습니다.\n`;
  } else {
    analysis += `- 채널 성장을 위한 콘텐츠 전략 수립이 필요합니다.\n`;
    analysis += `- 타겟 오디언스를 명확히 하고 정기적인 업로드 스케줄을 만들어보세요.\n`;
  }

  analysis += `\n📈 마케팅 제안:\n`;
  analysis += `- 의료 관련 교육 콘텐츠로 전문성을 어필하세요.\n`;
  analysis += `- 환자 후기나 시술 과정을 영상으로 제작해보세요.\n`;
  analysis += `- 건강 관련 팁이나 FAQ 영상으로 구독자와 소통하세요.\n`;
  analysis += `- 다른 마케팅 채널과 연계하여 통합적인 홍보 전략을 구축하세요.\n`;

  return analysis;
}
