"use client";

import AdminHeader from "@/components/admin-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Building2,
  Image as ImageIcon,
  ImagePlus,
  Tag,
  FileText,
  Calendar,
  Briefcase,
  MapPin,
  Phone,
  Users,
} from "lucide-react";

export default function ManagerDashboard() {
  const quickLinks = [
    {
      title: "업체 관리",
      description: "업체 정보를 관리하고 광고 상태를 설정합니다",
      href: "/manager/vendors",
      icon: Building2,
      color: "bg-blue-500",
    },
    {
      title: "제품 관리",
      description: "뷰티 제품 정보를 추가하고 수정합니다",
      href: "/manager/beauty-products",
      icon: ImageIcon,
      color: "bg-purple-500",
    },
    {
      title: "제품 이미지 관리",
      description: "뷰티 제품 이미지를 업로드하고 변경합니다",
      href: "/manager/beauty-products/images",
      icon: ImagePlus,
      color: "bg-violet-500",
    },
    {
      title: "카테고리 관리",
      description: "제품 카테고리를 생성하고 관리합니다",
      href: "/manager/beauty-product-categories",
      icon: Tag,
      color: "bg-green-500",
    },
    {
      title: "광고 로그",
      description: "모든 광고 설정/해제 작업 내역을 확인합니다",
      href: "/manager/advertisement-logs",
      icon: FileText,
      color: "bg-orange-500",
    },
    {
      title: "세미나 관리",
      description: "학회 및 세미나 정보를 관리합니다",
      href: "/manager/seminars",
      icon: Calendar,
      color: "bg-indigo-500",
    },
    {
      title: "구인게시판 관리",
      description: "의료진 채용 정보를 관리하고 승인합니다",
      href: "/manager/job-posts",
      icon: Briefcase,
      color: "bg-teal-500",
    },
    {
      title: "개원자리 관리",
      description: "병의원용 부동산 정보를 관리합니다",
      href: "/manager/clinic-locations",
      icon: MapPin,
      color: "bg-pink-500",
    },
    {
      title: "제품 연락처 관리",
      description: "각 제품별 연락처 정보를 관리합니다",
      href: "/manager/beauty-product-contacts",
      icon: Phone,
      color: "bg-cyan-500",
    },
    {
      title: "연락처별 제품 관리",
      description: "각 연락처가 담당하는 제품 목록을 확인합니다",
      href: "/manager/contact-products",
      icon: Users,
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader currentPath="/manager" />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">관리자 대시보드</h1>
          <p className="text-gray-500 text-sm">
            업체, 제품, 카테고리를 관리할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="cursor-pointer h-full border border-gray-200 bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`${link.color} w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <link.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-0.5 text-base">
                        {link.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-1">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
