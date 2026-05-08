import type { SWRConfiguration } from "swr";

export type FetchError = Error & {
  status?: number;
  info?: unknown;
};

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("API error") as FetchError;
    error.status = res.status;
    error.info = await res.json().catch(() => ({}));
    throw error;
  }
  return res.json();
};

export const swrConfig: SWRConfiguration = {
  onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
    const status = (error as FetchError)?.status;
    if (status === 401 || status === 403 || status === 404) return;
    if (retryCount >= 3) return;
    setTimeout(() => revalidate({ retryCount }), 1000 * Math.pow(2, retryCount));
  },
  dedupingInterval: 5000,
  revalidateOnFocus: true,
  refreshInterval: 0,
};
