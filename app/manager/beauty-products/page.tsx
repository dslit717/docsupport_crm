"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin-header";
import ProductFilterBar from "./components/ProductFilterBar";
import ProductTable from "./components/ProductTable";
import ProductFormDialog from "./components/ProductFormDialog";

interface Product {
  id: string;
  name: string;
  name_en?: string;
  brand: string;
  category_ids?: string[];
  description?: string;
  links?: Array<{ id?: string; name: string; url: string; type: string }>;
  contacts?: Array<{
    id: string;
    company_name_ko: string;
    company_name_en?: string;
    contact_number?: string;
    company_homepage?: string;
    person_in_charge?: string;
  }>;
  image_name?: string; // ProductDetailImage 필드 (이미지는 별도 페이지에서 관리)
  is_active?: boolean;
  categories?: Array<{
    id: string;
    name: string;
  }>;
}

interface Category {
  id: string;
  name: string;
}

export default function BeautyProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isActiveFilter, setIsActiveFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    brand: "",
    categoryIds: [] as string[],
    description: "",
    links: [] as Array<{ name: string; url: string; type: string }>,
    contacts: [] as Array<{
      id?: string;
      company_name_ko: string;
      company_name_en?: string;
      contact_number?: string;
      company_homepage?: string;
      person_in_charge?: string;
    }>,
    isActive: true,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await fetch("/manager-api/beauty-product-categories");
      const result = await response.json();
      if (response.ok) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error("카테고리 목록 로드 오류:", error);
    }
  };

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortField: sortField,
        sortDirection: sortDirection,
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter &&
          categoryFilter !== "all" && { category_id: categoryFilter }),
        ...(isActiveFilter &&
          isActiveFilter !== "all" && { is_active: isActiveFilter }),
      });

      const [countResponse, dataResponse] = await Promise.all([
        fetch(`/manager-api/beauty-products/count?${params}`),
        fetch(`/manager-api/beauty-products?${params}`),
      ]);

      const countResult = await countResponse.json();
      const dataResult = await dataResponse.json();

      if (countResponse.ok) {
        const count = countResult.count || 0;
        setTotalCount(count);
        setPagination((prev) => ({
          ...prev,
          total: count,
          totalPages: Math.ceil(count / prev.limit),
        }));
      }

      if (dataResponse.ok) {
        setProducts(dataResult.data || []);
      }
    } catch (error) {
      console.error("제품 목록 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchQuery, categoryFilter, isActiveFilter]);

  useEffect(() => {
    loadProducts();
  }, [
    pagination.page,
    pagination.limit,
    searchQuery,
    categoryFilter,
    isActiveFilter,
    sortField,
    sortDirection,
  ]);

  const resetForm = () => {
    setFormData({
      name: "",
      nameEn: "",
      brand: "",
      categoryIds: [],
      description: "",
      links: [],
      contacts: [],
      isActive: true,
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      nameEn: product.name_en || "",
      brand: product.brand,
      categoryIds: product.category_ids || [],
      description: product.description || "",
      links: product.links || [],
      contacts: product.contacts || [],
      isActive: product.is_active ?? true,
    });
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const productData: any = {
      name: formData.name,
      name_en: formData.nameEn,
      brand: formData.brand,
      category_ids: formData.categoryIds,
      description: formData.description,
      is_active: formData.isActive,
    };

    // 수정 모드일 때만 링크와 연락처 전달 (생성 모드는 항상 전달)
    if (dialogMode === "edit") {
      // 수정 모드에서는 항상 전달 (기존 데이터와 비교하여 추가/수정/삭제 처리)
      productData.links = formData.links || [];
      productData.contacts = formData.contacts || [];
    } else {
      // 생성 모드는 항상 전달
      productData.links = formData.links || [];
      productData.contacts = formData.contacts || [];
    }

    try {
      const url =
        dialogMode === "create"
          ? "/manager-api/beauty-products"
          : `/manager-api/beauty-products/${selectedProduct?.id}`;

      const response = await fetch(url, {
        method: dialogMode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setSelectedProduct(null);
        loadProducts();
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("제품 저장 오류:", error);
      alert("제품 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/manager-api/beauty-products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadProducts();
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("제품 삭제 오류:", error);
      alert("제품 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(
        `/manager-api/beauty-products/${id}/toggle`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !currentStatus }),
        }
      );

      if (response.ok) {
        // 로컬 상태 업데이트로 즉시 반영
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, is_active: !currentStatus } : p
          )
        );
        const result = await response.json();
        // 선택적: 토스트 알림 등으로 피드백 제공
        console.log(result.message);
      } else {
        const result = await response.json();
        alert(`상태 변경 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("상태 변경 오류:", error);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader currentPath="/manager/beauty-products" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">제품 관리</h1>
          <p className="text-gray-600 mt-2">
            뷰티 제품 정보를 관리할 수 있습니다.
          </p>
        </div>

        <div className="space-y-6">
          <ProductFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            isActiveFilter={isActiveFilter}
            setIsActiveFilter={setIsActiveFilter}
            categories={categories}
            pagination={pagination}
            setPagination={setPagination}
            openCreateDialog={openCreateDialog}
          />

          <ProductTable
            products={products}
            loading={loading}
            totalCount={totalCount}
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onEdit={openEditDialog}
            onDelete={handleDelete}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
            onToggleActive={handleToggleActive}
          />

          <ProductFormDialog
            isOpen={isDialogOpen}
            mode={dialogMode}
            formData={formData}
            categories={categories}
            onClose={() => {
              setIsDialogOpen(false);
              setSelectedProduct(null);
            }}
            onSubmit={handleSubmit}
            onChange={handleFormChange}
          />
        </div>
      </div>
    </div>
  );
}
