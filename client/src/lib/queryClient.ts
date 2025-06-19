import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";

// Overloaded function signatures
export function getQueryFn(): QueryFunction<any>;
export function getQueryFn(url: string): QueryFunction<any>;
export function getQueryFn<T>(options: { on401: UnauthorizedBehavior }): QueryFunction<T>;

export function getQueryFn<T>(
  urlOrOptions?: string | { on401: UnauthorizedBehavior }
): QueryFunction<T> {
  if (typeof urlOrOptions === "string") {
    // Direct URL case
    return async () => {
      const res = await fetch(urlOrOptions, {
        credentials: "include",
      });
      await throwIfResNotOk(res);
      return await res.json();
    };
  }

  const options = urlOrOptions || { on401: "throw" };
  return async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
