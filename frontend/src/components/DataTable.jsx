import { useMemo, useState } from "react";

const DataTable = ({ rows = [], columns = [], searchPlaceholder = "Search records" }) => {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filtered = useMemo(() => {
    const value = query.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(value));
  }, [query, rows]);

  const pageCount = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="rounded-lg border border-ink/10 bg-white shadow-soft dark:border-white/10 dark:bg-ink">
      <div className="flex flex-col gap-3 border-b border-ink/10 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
          className="focus-ring w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10 dark:text-white sm:max-w-xs"
        />
        <span className="text-sm text-ink/55 dark:text-white/55">{filtered.length} records</span>
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
            {current.map((row, index) => (
              <tr key={row._id || index} className="text-ink dark:text-white">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between p-4 text-sm">
        <button className="focus-ring rounded-lg border border-ink/20 px-3 py-2 disabled:opacity-40 dark:border-white/10 dark:text-white" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
          Previous
        </button>
        <span className="text-ink/60 dark:text-white/60">
          Page {page} of {pageCount}
        </span>
        <button className="focus-ring rounded-lg border border-ink/20 px-3 py-2 disabled:opacity-40 dark:border-white/10 dark:text-white" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

export default DataTable;
