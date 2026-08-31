'use client';

import * as React from 'react';
import {
  PageHeader,
  EmptyState,
  ErrorState,
} from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/skeleton';
import {
  FilterChips,
  ListSearchBar,
  Pagination,
  KpiRow,
  type FilterChip,
} from '@/components/admin/erp-list-shell';
import { Inbox } from 'lucide-react';
import { type UseQueryResult } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/api/api-client';

export interface ErpColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface ErpListPageProps<T> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  searchPlaceholder?: string;
  filterChips?: FilterChip[];
  filterValue?: string;
  onFilterChange?: (key: string) => void;
  extraFilters?: React.ReactNode;
  kpis?: React.ComponentProps<typeof KpiRow>['items'];
  columns: ErpColumn<T>[];
  query: UseQueryResult<ApiResponse<T[]>, unknown>;
  onSearchChange: (v: string) => void;
  search: string;
  page: number;
  perPage: number;
  onPageChange: (p: number) => void;
  onPerPageChange: (n: number) => void;
  emptyLabel?: string;
  rowKey: (row: T) => string;
}

export function ErpListPage<T>(props: ErpListPageProps<T>) {
  const {
    title,
    description,
    actions,
    searchPlaceholder,
    filterChips,
    filterValue,
    onFilterChange,
    extraFilters,
    kpis,
    columns,
    query,
    onSearchChange,
    search,
    page,
    perPage,
    onPageChange,
    onPerPageChange,
    emptyLabel,
    rowKey,
  } = props;

  const { data, isLoading, isError, refetch } = query;
  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? rows.length;
  const pageCount = data?.meta?.pages ?? Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={actions}
      />

      {kpis && kpis.length > 0 && <KpiRow items={kpis} />}

      <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <ListSearchBar
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          right={extraFilters}
        />
        {filterChips && filterChips.length > 0 && onFilterChange && (
          <FilterChips
            chips={filterChips}
            value={filterValue ?? 'all'}
            onChange={onFilterChange}
          />
        )}

        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState retry={() => void refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title={emptyLabel ?? 'No records yet'}
            description="Records will appear here as they are created for the selected branch."
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    {columns.map((c) => (
                      <th
                        key={c.key}
                        className="h-10 px-4 text-left font-medium text-muted-foreground"
                      >
                        {c.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={rowKey(r)}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={
                            c.className ?? 'px-4 py-3 align-middle'
                          }
                        >
                          {c.cell(r)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={onPageChange}
              perPage={perPage}
              onPerPageChange={onPerPageChange}
              total={total}
            />
          </>
        )}
      </div>
    </div>
  );
}
