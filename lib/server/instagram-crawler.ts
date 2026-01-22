export interface InstagramPost {
  id: string;
  shortCode: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  displayUrl: string;
  timestamp: string;
  type: string;
  url: string;
  hashtags: string[];
  mentions: string[];
}

export interface InstagramProfileInfo {
  username: string;
  fullName: string;
  profilePicture: string;
  postsCount: string;
  followersCount: string;
  followingCount: string;
  isBusinessAccount: boolean;
  bio: string;
  externalUrl?: string;
  externalUrls?: Array<{
    title: string;
    url: string;
    link_type: string;
  }>;
  isPrivate: boolean;
  isVerified: boolean;
  profileUrl: string;
  latestPosts?: InstagramPost[];
  businessCategoryName?: string;
}

export interface InstagramAnalysisResult {
  profileInfo?: InstagramProfileInfo;
  error?: string;
}

/**
 * Instagram URL 또는 사용자명에서 사용자명을 추출합니다.
 */
export function extractInstagramUsername(input: string): string | null {
  try {
    // URL인지 확인
    if (input.includes("instagram.com")) {
      const url = new URL(input);
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        return pathParts[0];
      }
    }

    // URL이 아닌 경우 사용자명으로 간주
    return input.replace("@", "").trim();
  } catch (error) {
    // URL 파싱 실패 시 사용자명으로 간주
    return input.replace("@", "").trim();
  }
}

/**
 * Instagram URL이 유효한지 확인합니다.
 */
export function isValidInstagramUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes("instagram.com");
  } catch {
    return false;
  }
}

/**
 * Instagram 사용자명이 유효한지 확인합니다.
 */
export function isValidInstagramUsername(username: string): boolean {
  // Instagram 사용자명 규칙: 1-30자, 영문자, 숫자, 언더스코어, 점만 허용
  const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/;
  return usernameRegex.test(username);
}

/**
 * Instagram 프로필 분석 리포트를 생성합니다.
 */
export function generateInstagramAnalysis(
  profileInfo: InstagramProfileInfo
): string {
  let analysis = `📸 Instagram 프로필 분석 결과:\n\n`;

  analysis += `👤 기본 정보:\n`;
  analysis += `- 사용자명: @${profileInfo.username}\n`;
  analysis += `- 이름: ${profileInfo.fullName}\n`;
  analysis += `- 계정 유형: ${
    profileInfo.isBusinessAccount ? "비즈니스 계정" : "개인 계정"
  }\n`;
  if (profileInfo.isVerified) {
    analysis += `- 인증 상태: ✅ 인증됨\n`;
  }
  if (profileInfo.isPrivate) {
    analysis += `- 공개 상태: 🔒 비공개 계정\n`;
  }
  analysis += `\n`;

  analysis += `📊 통계:\n`;
  analysis += `- 포스트: ${profileInfo.postsCount}개\n`;
  analysis += `- 팔로워: ${profileInfo.followersCount}명\n`;
  analysis += `- 팔로잉: ${profileInfo.followingCount}명\n`;

  const followersNum = parseInt(
    profileInfo.followersCount.replace(/[^\d]/g, "")
  );
  const followingNum = parseInt(
    profileInfo.followingCount.replace(/[^\d]/g, "")
  );

  if (followersNum > 0 && followingNum > 0) {
    const ratio = (followersNum / followingNum).toFixed(1);
    analysis += `- 팔로워/팔로잉 비율: ${ratio}:1\n`;
  }
  analysis += `\n`;

  if (profileInfo.bio && profileInfo.bio !== "정보 없음") {
    analysis += `📝 소개:\n${profileInfo.bio}\n\n`;
  }

  // 최근 포스트 분석
  if (profileInfo.latestPosts && profileInfo.latestPosts.length > 0) {
    analysis += `📱 최근 포스트 분석:\n`;
    const posts = profileInfo.latestPosts.slice(0, 3); // 최근 3개 포스트만 분석

    posts.forEach((post, idx) => {
      analysis += `\n${idx + 1}. 포스트 (${post.type}):\n`;
      analysis += `- 좋아요: ${post.likesCount}개\n`;
      analysis += `- 댓글: ${post.commentsCount}개\n`;
      if (post.caption && post.caption.length > 0) {
        const captionPreview =
          post.caption.length > 100
            ? post.caption.substring(0, 100) + "..."
            : post.caption;
        analysis += `- 내용: ${captionPreview}\n`;
      }
      if (post.hashtags.length > 0) {
        analysis += `- 해시태그: ${post.hashtags.slice(0, 5).join(", ")}\n`;
      }
    });
    analysis += `\n`;
  }

  analysis += `💡 인사이트:\n`;

  if (profileInfo.isBusinessAccount) {
    analysis += `- 비즈니스 계정으로 운영 중입니다. 마케팅에 적극적으로 활용할 수 있습니다.\n`;
  }

  if (followersNum > 10000) {
    analysis += `- 높은 팔로워 수를 보유하고 있어 영향력이 큽니다.\n`;
  } else if (followersNum > 1000) {
    analysis += `- 적당한 팔로워 수로 안정적인 커뮤니티를 형성하고 있습니다.\n`;
  } else {
    analysis += `- 성장 중인 계정입니다. 콘텐츠 전략을 통해 팔로워를 늘릴 수 있습니다.\n`;
  }

  if (followersNum > followingNum * 2) {
    analysis += `- 팔로워가 팔로잉보다 많아 영향력 있는 계정입니다.\n`;
  }

  if (profileInfo.bio && profileInfo.bio.length > 50) {
    analysis += `- 상세한 소개로 브랜드 아이덴티티가 잘 표현되어 있습니다.\n`;
  }

  // 포스트 관련 인사이트
  if (profileInfo.latestPosts && profileInfo.latestPosts.length > 0) {
    const avgLikes =
      profileInfo.latestPosts.reduce((sum, post) => sum + post.likesCount, 0) /
      profileInfo.latestPosts.length;
    const avgComments =
      profileInfo.latestPosts.reduce(
        (sum, post) => sum + post.commentsCount,
        0
      ) / profileInfo.latestPosts.length;

    analysis += `- 평균 좋아요: ${Math.round(
      avgLikes
    )}개, 평균 댓글: ${Math.round(avgComments)}개\n`;

    if (avgLikes > followersNum * 0.1) {
      analysis += `- 높은 참여율을 보이고 있어 팔로워들과의 상호작용이 활발합니다.\n`;
    }

    const hashtagUsage = profileInfo.latestPosts.some(
      (post) => post.hashtags.length > 0
    );
    if (hashtagUsage) {
      analysis += `- 해시태그를 적극 활용하여 검색 노출도를 높이고 있습니다.\n`;
    }
  }

  return analysis;
}
