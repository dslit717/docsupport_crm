"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin-header";
import ContactFilterBar from "./components/ContactFilterBar";
import ContactTable from "./components/ContactTable";
import ContactFormDialog from "./components/ContactFormDialog";

interface Contact {
  id: string;
  product_id: string;
  contact_id: string;
  product: {
    id: string;
    name: string;
    name_en?: string;
    brand: string;
    image_url?: string;
  };
  contact: {
    id: string;
    company_name_ko: string;
    company_name_en?: string;
    contact_number?: string;
    company_homepage?: string;
    person_in_charge?: string;
  };
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
}

export default function BeautyProductContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const [formData, setFormData] = useState({
    productId: "",
    companyNameKo: "",
    companyNameEn: "",
    contactNumber: "",
    companyHomepage: "",
    personInCharge: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Load products for dropdown (only active products)
  const loadProducts = async () => {
    try {
      const response = await fetch("/manager-api/beauty-products?limit=1000&is_active=true");
      const result = await response.json();
      if (response.ok) {
        const productList = result.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
        }));
        setProducts(productList);
      }
    } catch (error) {
      console.error("제품 목록 로드 오류:", error);
    }
  };

  // Load contacts
  const loadContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortField: sortField,
        sortDirection: sortDirection,
        ...(searchQuery && { search: searchQuery }),
        ...(productFilter &&
          productFilter !== "all" && { product_id: productFilter }),
      });

      const [countResponse, dataResponse] = await Promise.all([
        fetch(`/manager-api/beauty-product-contacts/count?${params}`),
        fetch(`/manager-api/beauty-product-contacts?${params}`),
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
        setContacts(dataResult.data || []);
      }
    } catch (error) {
      console.error("연락처 목록 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchQuery, productFilter]);

  useEffect(() => {
    loadContacts();
  }, [
    pagination.page,
    pagination.limit,
    searchQuery,
    productFilter,
    sortField,
    sortDirection,
  ]);

  const resetForm = () => {
    setFormData({
      productId: "",
      companyNameKo: "",
      companyNameEn: "",
      contactNumber: "",
      companyHomepage: "",
      personInCharge: "",
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const openEditDialog = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      productId: contact.product_id,
      companyNameKo: contact.contact.company_name_ko,
      companyNameEn: contact.contact.company_name_en || "",
      contactNumber: contact.contact.contact_number || "",
      companyHomepage: contact.contact.company_homepage || "",
      personInCharge: contact.contact.person_in_charge || "",
    });
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const contactData = {
      product_id: formData.productId,
      company_name_ko: formData.companyNameKo,
      company_name_en: formData.companyNameEn,
      contact_number: formData.contactNumber,
      company_homepage: formData.companyHomepage,
      person_in_charge: formData.personInCharge,
    };

    try {
      const url =
        dialogMode === "create"
          ? "/manager-api/beauty-product-contacts"
          : `/manager-api/beauty-product-contacts/${selectedContact?.id}`;

      const response = await fetch(url, {
        method: dialogMode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setIsDialogOpen(false);
        setSelectedContact(null);
        loadContacts();
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("연락처 저장 오류:", error);
      alert("연락처 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/manager-api/beauty-product-contacts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        loadContacts();
      } else {
        const result = await response.json();
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error("연락처 삭제 오류:", error);
      alert("연락처 삭제 중 오류가 발생했습니다.");
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

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader currentPath="/manager/beauty-product-contacts" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">제품 연락처 관리</h1>
          <p className="text-gray-600 mt-2">
            각 제품별 연락처 정보를 관리할 수 있습니다.
          </p>
        </div>

        <div className="space-y-6">
          <ContactFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            productFilter={productFilter}
            setProductFilter={setProductFilter}
            products={products}
            pagination={pagination}
            setPagination={setPagination}
            openCreateDialog={openCreateDialog}
          />

          <ContactTable
            contacts={contacts}
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
          />

          <ContactFormDialog
            isOpen={isDialogOpen}
            mode={dialogMode}
            formData={formData}
            products={products}
            onClose={() => {
              setIsDialogOpen(false);
              setSelectedContact(null);
            }}
            onSubmit={handleSubmit}
            onChange={handleFormChange}
          />
        </div>
      </div>
    </div>
  );
}

