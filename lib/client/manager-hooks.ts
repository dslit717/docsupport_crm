/**
 * Manager 페이지 공통 Hooks
 * 
 * API 호출, 데이터 페칭, 폼 관리 등의 공통 로직을 제공합니다.
 */

import { useState, useEffect, useCallback } from "react";

/**
 * API 호출 상태 타입
 */
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * 페이지네이션 상태
 */
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * 필터 상태 기본 타입
 */
export interface BaseFilterState {
  search: string;
  status?: string;
}

/**
 * API 호출 훅
 */
export function useApi<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = []
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchFn();
      setState({ data, loading: false, error: null });
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.message || "데이터 로드 실패",
      });
    }
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * 페이지네이션 훅
 */
export function usePagination(initialLimit: number = 20) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const setTotal = useCallback((total: number) => {
    setPagination((prev) => ({
      ...prev,
      total,
      totalPages: Math.ceil(total / prev.limit),
    }));
  }, []);

  return {
    pagination,
    setPage,
    setLimit,
    setTotal,
  };
}

/**
 * 필터 훅
 */
export function useFilters<T extends BaseFilterState>(initialState: T) {
  const [filters, setFilters] = useState<T>(initialState);

  const updateFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(initialState);
  }, [initialState]);

  return {
    filters,
    updateFilter,
    resetFilters,
    setFilters,
  };
}

/**
 * 정렬 훅
 */
export function useSort(
  defaultField: string = "created_at",
  defaultDirection: "asc" | "desc" = "desc"
) {
  const [sortField, setSortField] = useState(defaultField);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    defaultDirection
  );

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField]
  );

  return {
    sortField,
    sortDirection,
    handleSort,
  };
}

/**
 * 폼 상태 관리 훅
 */
export function useFormState<T extends Record<string, any>>(
  initialState: T
) {
  const [formData, setFormData] = useState<T>(initialState);

  const updateField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData(initialState);
  }, [initialState]);

  const setForm = useCallback((data: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  return {
    formData,
    updateField,
    resetForm,
    setForm,
  };
}

/**
 * 다이얼로그 상태 관리 훅
 */
export function useDialog<T = any>() {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogData, setDialogData] = useState<T | null>(null);

  const openDialog = useCallback((data?: T) => {
    setIsOpen(true);
    if (data) setDialogData(data);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setDialogData(null);
  }, []);

  return {
    isOpen,
    dialogData,
    openDialog,
    closeDialog,
  };
}

/**
 * 데이터 로딩 훅 (리스트용)
 */
export function useListData<T>(
  endpoint: string,
  filters: any,
  pagination: PaginationState,
  sortField: string,
  sortDirection: string
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortField,
        sortDirection,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "" && v != null)
        ),
      });

      const response = await fetch(`${endpoint}?${params}`);

      if (!response.ok) {
        throw new Error("데이터 로드 실패");
      }

      const result = await response.json();
      setData(result.data || []);

      if (result.total !== undefined) {
        return result.total;
      }
    } catch (err: any) {
      setError(err.message || "데이터 로드 중 오류 발생");
      setData([]);
    } finally {
      setLoading(false);
    }

    return 0;
  }, [endpoint, filters, pagination.page, pagination.limit, sortField, sortDirection]);

  return {
    data,
    loading,
    error,
    fetchData,
    setData,
  };
}

/**
 * CRUD 작업 훅
 */
export function useCrudOperations<T>(
  endpoint: string,
  onSuccess?: () => void
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (data: Partial<T>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "생성 실패");
        }

        const result = await response.json();
        onSuccess?.();
        return result.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, onSuccess]
  );

  const update = useCallback(
    async (id: string, data: Partial<T>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${endpoint}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "수정 실패");
        }

        const result = await response.json();
        onSuccess?.();
        return result.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, onSuccess]
  );

  const remove = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${endpoint}/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "삭제 실패");
        }

        onSuccess?.();
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, onSuccess]
  );

  return {
    loading,
    error,
    create,
    update,
    remove,
  };
}

