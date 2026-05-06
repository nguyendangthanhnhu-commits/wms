import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
  });

export function useInventory(params?: URLSearchParams | Record<string, string>) {
  const qs =
    params instanceof URLSearchParams
      ? params.toString()
      : params
        ? new URLSearchParams(params).toString()
        : "";

  const key = qs ? `/api/inventory?${qs}` : "/api/inventory";

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  return { inventory: data ?? [], error, isLoading, mutate };
}
