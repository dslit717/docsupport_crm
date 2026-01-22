"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin-header";
import ContactFilterBar from "./components/ContactFilterBar";
import ContactsTable from "./components/ContactsTable";

interface Product {
  id: string;
  name: string;
  name_en?: string;
  brand: string;
  image_url?: string;
  is_active: boolean;
}

interface ContactWithProducts {
  id: string;
  company_name_ko: string;
  company_name_en?: string;
  contact_number?: string;
  company_homepage?: string;
  person_in_charge?: string;
  products: Product[];
  product_count: number;
}

export default function ContactProductsPage() {
  const [contacts, setContacts] = useState<ContactWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("company_name_ko");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Load contacts with products
  const loadContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortField: sortField,
        sortDirection: sortDirection,
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/manager-api/contact-products?${params}`);
      const result = await response.json();

      if (response.ok) {
        setContacts(result.data || []);
        setPagination((prev) => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error("연락처 목록 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchQuery]);

  useEffect(() => {
    loadContacts();
  }, [pagination.page, pagination.limit, searchQuery, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader currentPath="/manager/contact-products" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">연락처별 제품 관리</h1>
          <p className="text-gray-600 mt-2">
            각 연락처가 담당하는 제품 목록을 확인할 수 있습니다.
          </p>
        </div>

        <div className="space-y-6">
          <ContactFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            pagination={pagination}
            setPagination={setPagination}
          />

          <ContactsTable
            contacts={contacts}
            loading={loading}
            totalCount={pagination.total}
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
          />
        </div>
      </div>
    </div>
  );
}

