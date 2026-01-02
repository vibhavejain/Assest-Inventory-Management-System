import { ReactNode } from 'react';
import { Loading } from './Loading';
import { EmptyState } from './EmptyState';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyState?: {
    title: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
  };
  onRowClick?: (item: T) => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyState,
  onRowClick,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border">
        <Loading text="Loading data..." />
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className="bg-surface rounded-xl border border-border">
        <EmptyState {...emptyState} />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-muted/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-6 py-3 text-left text-xs font-medium
                    text-text-secondary uppercase tracking-wider
                    ${column.className || ''}
                  `}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={`
                  hover:bg-surface-muted/50 transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 text-sm text-text-primary ${column.className || ''}`}
                  >
                    {column.render
                      ? column.render(item)
                      : ((item as Record<string, unknown>)[column.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <div className="text-sm text-text-secondary">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm rounded-lg border border-border hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm rounded-lg border border-border hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
