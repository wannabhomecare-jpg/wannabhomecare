import type { TableRow } from "@/content/categories/types";

/** 열 머리 + 행 이름이 있는 비교 표. 휴대폰은 가로로 넘긴다. highlightLast 면 마지막 열을 강조 */
export function CompareTable({ caption, columns, rows, highlightLast = false }: { caption: string; columns: string[]; rows: TableRow[]; highlightLast?: boolean }) {
  return (
    <div className="hide-scrollbar -mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0" tabIndex={0} role="region" aria-label={`${caption} (가로로 넘겨 보세요)`}>
      <table className="w-full min-w-[640px] overflow-hidden rounded-2xl border border-brand-200 bg-white text-left text-[15px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-brand-900 text-white">
            <td className="w-32 px-4 py-3.5" />
            {columns.map((col, i) => (
              <th key={col} scope="col" className={`px-4 py-3.5 font-extrabold ${highlightLast && i === columns.length - 1 ? "bg-brand-600" : ""}`}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-100">
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="bg-brand-50 px-4 py-4 font-black whitespace-nowrap text-brand-900">
                {r.label}
              </th>
              {r.values.map((v, i) => (
                <td key={i} className={`px-4 py-4 leading-7 text-slate-700 ${highlightLast && i === r.values.length - 1 ? "bg-brand-50 font-bold text-brand-900" : ""}`}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
