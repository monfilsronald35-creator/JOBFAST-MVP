const API_BASE_URL =
  import.meta.env['VITE_API_URL']?.replace(/\/+$/, '') ||
  'http://localhost:5000/api/v1';

type ApiRequestOptions = RequestInit & {
  token?: string | null;
};

export async function apiClient<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;

  const response = await fetch(
    `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`,
    {
      ...requestOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
    },
  );

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof (body as { message?: unknown }).message === 'string'
        ? (body as { message: string }).message
        : `API request failed with status ${response.status}`;

    throw new Error(message);
  }

  return body as T;
}
