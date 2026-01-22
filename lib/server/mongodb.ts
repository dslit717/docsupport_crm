import { MongoClient, Db, Collection } from "mongodb";

// MongoDB 연결 문자열
const MONGODB_URI = process.env.MONGODB_CONNECTION_STRING;

if (!MONGODB_URI) {
  throw new Error("MONGODB_CONNECTION_STRING 환경변수가 설정되지 않았습니다.");
}

// MongoDB 클라이언트 인스턴스
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * MongoDB 연결 (싱글톤 패턴)
 */
export async function connectToMongoDB(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  // 이미 연결된 경우 캐시된 연결 반환
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    // 새 연결 생성
    const client = await MongoClient.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    });

    const db = client.db("ai_wiki");

    // 연결 캐싱
    cachedClient = client;
    cachedDb = db;

    console.log("✅ MongoDB 연결 성공: ai_wiki");

    return { client, db };
  } catch (error) {
    console.error("❌ MongoDB 연결 실패:", error);
    throw new Error("MongoDB 연결에 실패했습니다.");
  }
}

/**
 * MongoDB 컬렉션 가져오기
 */
export async function getCollection<T = any>(
  collectionName: string
): Promise<Collection<T>> {
  const { db } = await connectToMongoDB();
  return db.collection<T>(collectionName);
}

/**
 * marketing_chart 컬렉션 타입 정의
 */
export interface CrawlingItem {
  _id: string;
  url: string;
  title: string;
  description?: string;
  author?: string;
  published_date?: Date | string;
  platform: "youtube" | "blog" | "instagram" | "review";
  category?: string;
  tags?: string[];
  thumbnail_url?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  rating?: number;
  crawled_at: Date | string;
  updated_at?: Date | string;
  status: "active" | "inactive" | "pending";
  metadata?: Record<string, any>;
}

/**
 * marketing_chart 컬렉션 데이터 조회
 */
export async function getCrawlingList(filter: {
  platform?: "youtube" | "blog" | "instagram" | "review";
  category?: string;
  status?: "active" | "inactive" | "pending";
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
}): Promise<CrawlingItem[]> {
  try {
    const collection = await getCollection<CrawlingItem>("marketing_chart");

    // 쿼리 필터 구성
    const query: Record<string, any> = {};
    if (filter.platform) query.platform = filter.platform;
    if (filter.category) query.category = filter.category;
    if (filter.status) query.status = filter.status;

    // 기본 정렬: 최신순
    const sort = filter.sort || { crawled_at: -1 };

    // 데이터 조회
    const items = await collection
      .find(query)
      .sort(sort)
      .skip(filter.skip || 0)
      .limit(filter.limit || 50)
      .toArray();

    return items as CrawlingItem[];
  } catch (error) {
    console.error("❌ marketing_chart 조회 실패:", error);
    throw new Error("마케팅 차트 데이터를 가져오는데 실패했습니다.");
  }
}

/**
 * marketing_chart 컬렉션 데이터 개수 조회
 */
export async function getCrawlingListCount(filter: {
  platform?: "youtube" | "blog" | "instagram" | "review";
  category?: string;
  status?: "active" | "inactive" | "pending";
}): Promise<number> {
  try {
    const collection = await getCollection<CrawlingItem>("marketing_chart");

    const query: Record<string, any> = {};
    if (filter.platform) query.platform = filter.platform;
    if (filter.category) query.category = filter.category;
    if (filter.status) query.status = filter.status;

    const count = await collection.countDocuments(query);
    return count;
  } catch (error) {
    console.error("❌ marketing_chart 개수 조회 실패:", error);
    return 0;
  }
}

/**
 * marketing_chart 단일 아이템 조회
 */
export async function getCrawlingItemById(
  id: string
): Promise<CrawlingItem | null> {
  try {
    const collection = await getCollection<CrawlingItem>("marketing_chart");
    const item = await collection.findOne({ _id: id } as any);
    return item as CrawlingItem | null;
  } catch (error) {
    console.error("❌ marketing_chart 아이템 조회 실패:", error);
    return null;
  }
}

/**
 * MongoDB 연결 종료
 */
export async function disconnectFromMongoDB(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log("✅ MongoDB 연결 종료");
  }
}
