const API_BASE = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  token?: string;
  user?: T;
  error?: string;
}

async function fetchWrapper<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, config);
    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.error || '请求失败');
    }

    return (data.data || data.user || data) as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('网络错误，请检查连接');
  }
}

function addAuthHeader(headers: HeadersInit): HeadersInit {
  const token = localStorage.getItem('token');
  if (token) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return headers;
}

export async function apiGet<T = any>(url: string): Promise<T> {
  return fetchWrapper<T>(url, {
    method: 'GET',
  });
}

export async function apiPost<T = any>(url: string, body?: any): Promise<T> {
  return fetchWrapper<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiGetAuth<T = any>(url: string): Promise<T> {
  return fetchWrapper<T>(url, {
    method: 'GET',
    headers: addAuthHeader({}),
  });
}

export async function apiPostAuth<T = any>(url: string, body?: any): Promise<T> {
  return fetchWrapper<T>(url, {
    method: 'POST',
    headers: addAuthHeader({}),
    body: JSON.stringify(body),
  });
}
