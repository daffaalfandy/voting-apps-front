const TOKEN_KEY = 'voting-app.token';

// Storage can throw in private windows or when site data is blocked; treat that as "no session".
export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* session lasts until reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nothing stored */
    }
  },
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

let onUnauthorized: () => void = () => {};

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

interface ErrorBody {
  error?: { message?: string; details?: { message: string }[] };
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      onUnauthorized();
    }
    const body = data as ErrorBody | null;
    const message = body?.error?.details?.[0]?.message ?? body?.error?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}
