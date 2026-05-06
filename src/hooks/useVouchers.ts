import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
  });

export function useVouchers(params?: URLSearchParams | Record<string, string>) {
  const qs =
    params instanceof URLSearchParams
      ? params.toString()
      : params
        ? new URLSearchParams(params).toString()
        : "";

  const key = qs ? `/api/vouchers?${qs}` : "/api/vouchers";

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  return { vouchers: data ?? [], error, isLoading, mutate };
}
