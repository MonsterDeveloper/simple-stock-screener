import type { Ticker } from "@/entities/ticker"
import { type Table, flexRender } from "@tanstack/react-table"
export function TableHeader({
  table,
}: {
  table: Table<Ticker>
}) {
  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id} className="border-b-2 dark:border-b-white/10">
          {headerGroup.headers.map((header, index, headers) => (
            <th
              key={header.id}
              className="-top-px sticky z-10 bg-bg-primary bg-white/50 px-4 py-1.5 text-left font-normal text-sm text-zinc-500 backdrop-blur-xs dark:bg-zinc-900/50"
              style={
                index === headers.length - 1
                  ? undefined
                  : { width: header.getSize() }
              }
            >
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
            </th>
          ))}
        </tr>
      ))}
    </thead>
  )
}
