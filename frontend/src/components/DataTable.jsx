import { useMemo, useState } from "react";

const DataTable = ({
  rows = [],
  columns = [],
  searchPlaceholder = "Search records",
  serverSide = false,
  query = "",
  onQueryChange,
  page = 1,
  pageCount = 1,
  onPageChange,
  totalCount,
  pageSize = 6
}) => {
  const [localQuery, setLocalQuery] = useState("");
  const [localPage, setLocalPage] = useState(1);

  const activeQuery = serverSide ? query : localQuery;
  const activePage = serverSide ? page : localPage;

  const filtered = useMemo(() => {
    if (serverSide) return rows;
    const value = activeQuery.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(value));
  }, [activeQuery, rows, serverSide]);

  const computedPageCount = serverSide ? Math.max(pageCount || 1, 1) : Math.max(Math.ceil(filtered.length / pageSize), 1);
  const current = serverSide ? rows : filtered.slice((activePage - 1) * pageSize, activePage * pageSize);
  const recordCount = serverSide ? totalCount ?? rows.length : filtered.length;

  const updateQuery = (value) => {
    if (serverSide) {
      onQueryChange?.(value);
      return;
    }
    setLocalQuery(value);
    setLocalPage(1);
  };

  const movePage = (nextPage) => {
    if (serverSide) {
      onPageChange?.(nextPage);
      return;
    }
    setLocalPage(nextPage);
  };

  return (
    <div className="rounded-lg border border-ink/10 bg-white shadow-soft dark:border-white/10 dark:bg-ink">
      <div className="flex flex-col gap-3 border-b border-ink/10 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <input
          value={activeQuery}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className="focus-ring w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10 dark:text-white sm:max-w-xs"
        />
        <span className="text-sm text-ink/55 dark:text-white/55">{recordCount} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-wide text-ink/60 dark:bg-white/5 dark:text-white/60">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10 dark:divide-white/10">
            {current.length ? (
              current.map((row, index) => (
                <tr key={row._id || index} className="text-ink dark:text-white">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-ink/55 dark:text-white/55">
                  No records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between p-4 text-sm">
        <button className="focus-ring rounded-lg border border-ink/20 px-3 py-2 disabled:opacity-40 dark:border-white/10 dark:text-white" disabled={activePage === 1} onClick={() => movePage(activePage - 1)}>
          Previous
        </button>
        <span className="text-ink/60 dark:text-white/60">
          Page {activePage} of {computedPageCount}
        </span>
        <button className="focus-ring rounded-lg border border-ink/20 px-3 py-2 disabled:opacity-40 dark:border-white/10 dark:text-white" disabled={activePage === computedPageCount} onClick={() => movePage(activePage + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

export default DataTable;
