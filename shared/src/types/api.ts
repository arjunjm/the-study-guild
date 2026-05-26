export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CourseListParams {
  l1?: string;
  l2?: string;
  difficulty?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}
