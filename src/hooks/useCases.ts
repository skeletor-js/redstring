/**
 * TanStack Query hooks for case data fetching and caching.
 *
 * Provides React hooks that manage server state for cases, including
 * automatic caching, refetching, and pagination.
 */

import {
  useQuery,
  useInfiniteQuery,
  UseQueryResult,
  UseInfiniteQueryResult,
  InfiniteData,
} from '@tanstack/react-query';
import { FilterState } from '../types/filter';
import { Case, CaseListResponse, StatsSummary } from '../types/case';
import { getCases, getCaseById, getStatsSummary, searchCases } from '../services/cases';

/**
 * Query key factory for case-related queries.
 *
 * Provides consistent query keys for caching and invalidation.
 */
export const caseKeys = {
  all: ['cases'] as const,
  lists: () => [...caseKeys.all, 'list'] as const,
  list: (filters: FilterState) => [...caseKeys.lists(), filters] as const,
  details: () => [...caseKeys.all, 'detail'] as const,
  detail: (id: string) => [...caseKeys.details(), id] as const,
  stats: () => [...caseKeys.all, 'stats'] as const,
  stat: (filters: FilterState) => [...caseKeys.stats(), filters] as const,
  search: (query: string) => [...caseKeys.all, 'search', query] as const,
};

/**
 * Hook to fetch paginated cases with infinite scroll support.
 *
 * Uses cursor-based pagination. Call `fetchNextPage()` to load more results.
 *
 * @param filters - Filter criteria
 * @param limit - Number of records per page (default: 100)
 * @returns Infinite query result with cases and pagination
 *
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage, isFetching } = useCases(filters);
 *
 * // Access all pages
 * const allCases = data?.pages.flatMap(page => page.cases) ?? [];
 *
 * // Load more
 * if (hasNextPage && !isFetching) {
 *   fetchNextPage();
 * }
 * ```
 */
export const useCases = (
  filters: FilterState,
  limit: number = 100
): UseInfiniteQueryResult<CaseListResponse, Error> => {
  return useInfiniteQuery<CaseListResponse, Error, CaseListResponse, readonly ["cases", "list", FilterState], string | undefined>({
    queryKey: caseKeys.list(filters),
    queryFn: ({ pageParam }) => getCases(filters, pageParam, limit),
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    initialPageParam: undefined,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes (renamed from cacheTime in v5)
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch a single case by ID.
 *
 * @param id - Case ID (format: {state}_{year}_{incident})
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with case details
 *
 * @example
 * ```tsx
 * const { data: caseData, isLoading, error } = useCase(caseId);
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return <CaseDetail case={caseData} />;
 * ```
 */
export const useCase = (
  id: string,
  enabled: boolean = true
): UseQueryResult<Case, Error> => {
  return useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: () => getCaseById(id),
    enabled: enabled && id.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes (case details don't change often)
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch summary statistics for filtered cases.
 *
 * Returns aggregate metrics without loading all cases.
 * Useful for displaying quick stats in the UI.
 *
 * @param filters - Filter criteria
 * @param enabled - Whether to run the query (default: true)
 * @returns Query result with stats summary
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useStatsSummary(filters);
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <div>
 *     <p>Total: {stats.total_count}</p>
 *     <p>Solved: {stats.solved_count} ({stats.solve_rate}%)</p>
 *   </div>
 * );
 * ```
 */
export const useStatsSummary = (
  filters: FilterState,
  enabled: boolean = true
): UseQueryResult<StatsSummary, Error> => {
  return useQuery({
    queryKey: caseKeys.stat(filters),
    queryFn: () => getStatsSummary(filters),
    enabled,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to search cases by text query.
 *
 * @param query - Search query string
 * @param enabled - Whether to run the query (default: true, but skips if query is empty)
 * @param limit - Number of results to return
 * @returns Query result with search results
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const { data, isLoading } = useSearchCases(searchTerm);
 *
 * return (
 *   <div>
 *     <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
 *     {isLoading ? <Spinner /> : <Results cases={data?.cases} />}
 *   </div>
 * );
 * ```
 */
export const useSearchCases = (
  query: string,
  enabled: boolean = true,
  limit: number = 100
): UseQueryResult<CaseListResponse, Error> => {
  return useQuery({
    queryKey: caseKeys.search(query),
    queryFn: () => searchCases(query, limit),
    enabled: enabled && query.length > 0,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to prefetch cases with given filters.
 *
 * Useful for prefetching data when user hovers over a filter or tab.
 *
 * @param filters - Filter criteria to prefetch
 * @returns Prefetch function
 *
 * @example
 * ```tsx
 * const prefetchCases = usePrefetchCases(filters);
 *
 * return (
 *   <button onMouseEnter={prefetchCases}>
 *     Apply Filters
 *   </button>
 * );
 * ```
 */
export const usePrefetchCases = (_filters: FilterState) => {
  // Note: This would require useQueryClient() from @tanstack/react-query
  // Simplified for now
  return () => {
    // Prefetching implementation to be added later
    console.log('Prefetching cases');
  };
};

/**
 * Hook to get the total count from the latest cases query.
 *
 * Extracts the total count without loading all pages.
 *
 * @param data - Data from useCases hook
 * @returns Total count or 0 if no data
 *
 * @example
 * ```tsx
 * const casesQuery = useCases(filters);
 * const totalCount = useTotalCount(casesQuery.data);
 *
 * return <div>Found {totalCount} cases</div>;
 * ```
 */
export const useTotalCount = (
  data: InfiniteData<CaseListResponse> | undefined
): number => {
  if (!data || !data.pages || data.pages.length === 0) return 0;
  return data.pages[0].total_count;
};

/**
 * Hook to get all loaded cases across all pages.
 *
 * Flattens the paginated data structure into a single array.
 *
 * @param data - Data from useCases hook
 * @returns Flat array of all loaded cases
 *
 * @example
 * ```tsx
 * const casesQuery = useCases(filters);
 * const allCases = useAllCases(casesQuery.data);
 *
 * return <CaseTable cases={allCases} />;
 * ```
 */
export const useAllCases = (
  data: InfiniteData<CaseListResponse> | undefined
): Case[] => {
  if (!data || !data.pages) return [];
  return data.pages.flatMap((page: CaseListResponse) => page.cases);
};
