"use server";

import {
  extractInstagramUsername,
  isValidInstagramUrl,
  isValidInstagramUsername,
  generateInstagramAnalysis,
  type InstagramProfileInfo,
  type InstagramAnalysisResult,
} from "./instagram-crawler";

/**
 * APIPY를 사용하여 Instagram 프로필 정보를 가져옵니다.
 */
async function fetchInstagramProfileWithAPIPY(
  username: string
): Promise<InstagramProfileInfo> {
  const apiKey = process.env.APIPY_API_KEY;
  if (!apiKey) {
    throw new Error("APIPY_API_KEY가 설정되지 않았습니다.");
  }
  console.log(`🔍 APIPY Instagram 프로필 검색: ${username}`);

  // APIPY 동기 실행 API 사용
  const response = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usernames: [username],
        resultsType: "details",
        addParentData: false,
        searchType: "user",
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 408) {
      throw new Error(
        "Instagram 프로필 검색이 시간 초과되었습니다. (300초 초과)"
      );
    }
    throw new Error(
      `APIPY 실행 오류: ${response.status} ${response.statusText}`
    );
  }

  const results = await response.json();
  console.log(`결과 개수: ${results?.length || 0}`);
  console.log("전체 결과 데이터:", JSON.stringify(results, null, 2));

  if (results && results.length > 0) {
    const profile = results[0];
    console.log("프로필 데이터:", JSON.stringify(profile, null, 2));

    // 최근 포스트 데이터 파싱
    const latestPosts =
      profile.latestPosts?.map((post: any) => ({
        id: post.id || "",
        shortCode: post.shortCode || "",
        caption: post.caption || "",
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        displayUrl: post.displayUrl || "",
        timestamp: post.timestamp || "",
        type: post.type || "",
        url: post.url || "",
        hashtags: post.hashtags || [],
        mentions: post.mentions || [],
      })) || [];

    return {
      username: profile.username || username,
      fullName: profile.fullName || "정보 없음",
      profilePicture: profile.profilePicUrl || "",
      postsCount: profile.postsCount?.toString() || "0",
      followersCount: profile.followersCount?.toString() || "0",
      followingCount: profile.followsCount?.toString() || "0",
      isBusinessAccount: profile.isBusinessAccount || false,
      bio: profile.biography || "정보 없음",
      externalUrl: profile.externalUrl || undefined,
      externalUrls: profile.externalUrls || undefined,
      isPrivate: profile.isPrivate || false,
      isVerified: profile.isVerified || false,
      profileUrl: `https://www.instagram.com/${profile.username || username}/`,
      latestPosts: latestPosts,
      businessCategoryName: profile.businessCategoryName || undefined,
    };
  } else {
    console.log("결과 데이터가 없습니다.");
    throw new Error(
      "Instagram 프로필 데이터를 찾을 수 없습니다. 사용자명을 확인해주세요."
    );
  }
}

/**
 * Instagram 프로필 정보를 크롤링합니다. (서버 액션)
 */
export async function crawlInstagramProfileAction(
  input: string
): Promise<InstagramAnalysisResult> {
  try {
    const username = extractInstagramUsername(input);

    if (!username) {
      return {
        profileInfo: {
          username: "오류",
          fullName: "오류",
          profilePicture: "",
          postsCount: "0",
          followersCount: "0",
          followingCount: "0",
          isBusinessAccount: false,
          bio: "사용자명을 입력해주세요.",
          isPrivate: false,
          isVerified: false,
          profileUrl: "",
        },
        error: "사용자명을 입력해주세요.",
      };
    }

    if (!isValidInstagramUsername(username)) {
      return {
        profileInfo: {
          username: "오류",
          fullName: "오류",
          profilePicture: "",
          postsCount: "0",
          followersCount: "0",
          followingCount: "0",
          isBusinessAccount: false,
          bio: "유효하지 않은 Instagram 사용자명입니다.",
          isPrivate: false,
          isVerified: false,
          profileUrl: "",
        },
        error: "유효하지 않은 Instagram 사용자명입니다.",
      };
    }

    console.log("Crawling Instagram profile:", username);

    // APIPY로 Instagram 프로필 정보 가져오기
    const profileInfo = await fetchInstagramProfileWithAPIPY(username);

    console.log("Instagram profile info extracted:", {
      username: profileInfo.username,
      fullName: profileInfo.fullName,
      postsCount: profileInfo.postsCount,
      followersCount: profileInfo.followersCount,
      hasProfilePicture: !!profileInfo.profilePicture,
    });

    return {
      profileInfo: profileInfo,
    };
  } catch (error) {
    console.error("Error crawling Instagram profile:", error);

    return {
      profileInfo: {
        username: "오류",
        fullName: "오류",
        profilePicture: "",
        postsCount: "0",
        followersCount: "0",
        followingCount: "0",
        isBusinessAccount: false,
        bio:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
        isPrivate: false,
        isVerified: false,
        profileUrl: "",
      },
      error:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    };
  }
}
