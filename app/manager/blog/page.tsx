"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit2, Trash2, Eye, Heart, MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface BlogTag {
  id: string;
  name: string;
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name?: string;
  status: "draft" | "published" | "archived";
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  tags?: BlogTag[];
}

export default function BlogManagementPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchApplied, setSearchApplied] = useState(""); // 조회에 사용 중인 키워드

  useEffect(() => {
    loadPosts();
  }, [statusFilter, searchApplied]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ status: statusFilter });
      if (searchApplied) params.set("q", searchApplied);
      const url = `/manager-api/blog/posts?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setPosts(data.posts || []);
      } else {
        console.error("블로그 글 로딩 실패:", data.error);
      }
    } catch (error) {
      console.error("블로그 글 로딩 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 블로그 글을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/manager-api/blog/posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("블로그 글이 삭제되었습니다.");
        loadPosts();
      } else {
        const data = await response.json();
        alert("삭제 실패: " + data.error);
      }
    } catch (error) {
      console.error("블로그 글 삭제 중 오류:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "published") {
      return <Badge className="bg-green-500">공개</Badge>;
    }
    return <Badge className="bg-red-500">비공개</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader currentPath="/manager/blog" />
      
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">블로그 관리</h1>
              <p className="text-gray-600 mt-2">
                의학 전문 블로그 글을 작성하고 관리합니다
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/manager/blog/tags">
                <Button variant="outline">태그 관리</Button>
              </Link>
              <Link href="/manager/blog/new">
                <Button className="flex items-center gap-2">
                  <PlusCircle size={20} />
                  새 글 작성
                </Button>
              </Link>
            </div>
          </div>

          {/* 필터 */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
            >
              전체
            </Button>
            <Button
              variant={statusFilter === "published" ? "default" : "outline"}
              onClick={() => setStatusFilter("published")}
            >
              공개
            </Button>
            <Button
              variant={statusFilter === "draft" ? "default" : "outline"}
              onClick={() => setStatusFilter("draft")}
            >
              비공개
            </Button>
          </div>

          {/* 조회 */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="제목·내용으로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setSearchApplied(searchQuery.trim())}
                className="pl-9"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setSearchApplied(searchQuery.trim())}
            >
              조회
            </Button>
            {searchApplied && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSearchApplied("");
                }}
              >
                검색 초기화
              </Button>
            )}
          </div>
        </div>

        {/* 블로그 목록 */}
        {loading ? (
          <div className="text-center py-12">로딩 중...</div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">작성된 블로그 글이 없습니다</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="p-6 transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{post.title}</h3>
                      {getStatusBadge(post.status)}
                    </div>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {post.tags.map((tag) => (
                          <Badge key={tag.id} variant="outline">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {post.content.substring(0, 150)}...
                    </p>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye size={16} />
                        {post.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={16} />
                        {post.like_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={16} />
                        {post.comment_count}
                      </span>
                      <span>작성자: {post.author_name || "관리자"}</span>
                      <span>
                        {new Date(post.created_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/manager/blog/${post.id}`)}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


