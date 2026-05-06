import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
  });

export function useWarehouses() {
  const { data, error, isLoading, mutate } = useSWR("/api/warehouses", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  return { warehouses: data ?? [], error, isLoading, mutate };
}
