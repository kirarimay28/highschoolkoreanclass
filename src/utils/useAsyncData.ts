import { useCallback, useEffect, useState, type DependencyList } from 'react';

/**
 * 서비스(비동기) 함수를 화면에서 쓰기 위한 작은 훅.
 * const { data, loading, reload } = useAsyncData(() => listPosts(cat), [cat]);
 */
export function useAsyncData<T>(loader: () => Promise<T>, deps: DependencyList, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await run());
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    run()
      .then((v) => alive && setData(v))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [run]);

  return { data, loading, reload, setData };
}
