// 브라우저에서 API 를 부를 때 쓰는 작은 헬퍼. 주소는 항상 상대 경로('/api/...')로 쓴다.

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError('인터넷 연결을 확인해 주세요.', 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      // 세션이 만료됐으면 새로고침 → proxy 가 /login 으로 보낸다
      window.location.reload();
    }
    throw new ApiClientError(data.error ?? '문제가 생겼어요. 다시 시도해 주세요.', res.status);
  }
  return data as T;
}
