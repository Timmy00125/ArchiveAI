"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Braces,
  FileText,
  Hash,
  ImageIcon,
  ListTree,
  Table2,
  Type,
} from "lucide-react";

interface StructureExplorerProps {
  structure: unknown;
}

interface HierarchyItem {
  type?: string;
  text?: string;
  page?: number | string | null;
  level?: number;
}

interface TableInfo {
  table_number?: number;
  page?: number | string | null;
  caption?: string | null;
  dataframe?: Record<string, unknown>[];
  shape?: number[];
  is_empty?: boolean;
}

type ExplorerView = "outline" | "tables" | "raw";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
}

function asStructureRecord(structure: unknown): Record<string, unknown> {
  if (typeof structure === "string") {
    try {
      const parsed = JSON.parse(structure) as unknown;
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return isRecord(structure) ? structure : {};
}

function getText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getPageLabel(page: HierarchyItem["page"]): string {
  if (page == null || page === "") return "Page N/A";
  return `Page ${page}`;
}

function collectColumns(rows: Record<string, unknown>[]): string[] {
  const columns = new Set<string>();
  rows.slice(0, 5).forEach((row) => {
    Object.keys(row).forEach((key) => columns.add(key));
  });
  return Array.from(columns).slice(0, 6);
}

function toCellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

export function StructureExplorer({ structure }: StructureExplorerProps) {
  const [view, setView] = useState<ExplorerView>("outline");
  const [selectedHeadingIndex, setSelectedHeadingIndex] = useState(0);

  const parsed = useMemo(() => asStructureRecord(structure), [structure]);
  const summary = isRecord(parsed.summary) ? parsed.summary : {};

  const hierarchy = useMemo<HierarchyItem[]>(
    () =>
      asRecordArray(parsed.hierarchy).map((item) => ({
        type: getText(item.type),
        text: getText(item.text),
        page: typeof item.page === "string" || typeof item.page === "number"
          ? item.page
          : null,
        level: getNumber(item.level),
      })),
    [parsed.hierarchy],
  );

  const headings = hierarchy.filter((item) => item.text);

  const tables = useMemo<TableInfo[]>(
    () =>
      asRecordArray(parsed.tables).map((table) => ({
        table_number: getNumber(table.table_number),
        page: typeof table.page === "string" || typeof table.page === "number"
          ? table.page
          : null,
        caption: typeof table.caption === "string" ? table.caption : null,
        dataframe: asRecordArray(table.dataframe),
        shape: Array.isArray(table.shape)
          ? table.shape.filter((value): value is number => typeof value === "number")
          : undefined,
        is_empty: typeof table.is_empty === "boolean" ? table.is_empty : undefined,
      })),
    [parsed.tables],
  );

  const rawJson = useMemo(() => JSON.stringify(structure, null, 2), [structure]);
  const selectedHeading = headings[selectedHeadingIndex];

  const stats = [
    {
      label: "Texts",
      value: summary.num_texts,
      icon: Type,
    },
    {
      label: "Sections",
      value: summary.text_types && isRecord(summary.text_types)
        ? summary.text_types.section_header
        : headings.length,
      icon: ListTree,
    },
    {
      label: "Tables",
      value: summary.num_tables ?? tables.length,
      icon: Table2,
    },
    {
      label: "Pictures",
      value: summary.num_pictures,
      icon: ImageIcon,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {label}
              </span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {typeof value === "number" ? value.toLocaleString() : "N/A"}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "outline", label: "Outline", icon: ListTree },
          { id: "tables", label: "Tables", icon: Table2 },
          { id: "raw", label: "Raw JSON", icon: Braces },
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            type="button"
            variant={view === id ? "default" : "outline"}
            size="sm"
            onClick={() => setView(id as ExplorerView)}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
      </div>

      {view === "outline" && (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.4fr)]">
          <ScrollArea className="min-h-[280px] rounded-lg border bg-background">
            <div className="space-y-1 p-2">
              {headings.length > 0 ? (
                headings.map((item, index) => (
                  <button
                    key={`${item.text}-${index}`}
                    type="button"
                    onClick={() => setSelectedHeadingIndex(index)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                      selectedHeadingIndex === index && "bg-muted text-primary",
                    )}
                    style={{ paddingLeft: `${8 + Math.min(item.level ?? 1, 5) * 8}px` }}
                  >
                    <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-2">{item.text}</span>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No heading hierarchy found.
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="rounded-lg border bg-muted/20 p-5">
            {selectedHeading ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      Selected Section
                    </div>
                    <h3 className="mt-2 text-xl font-semibold leading-tight">
                      {selectedHeading.text}
                    </h3>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    Level {selectedHeading.level ?? "N/A"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">{selectedHeading.type || "section"}</Badge>
                  <Badge variant="secondary">
                    {getPageLabel(selectedHeading.page)}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a heading to inspect it.
              </div>
            )}
          </div>
        </div>
      )}

      {view === "tables" && (
        <ScrollArea className="min-h-[360px] rounded-lg border bg-background">
          <div className="space-y-4 p-4">
            {tables.length > 0 ? (
              tables.map((table, index) => {
                const rows = table.dataframe ?? [];
                const columns = collectColumns(rows);

                return (
                  <div key={index} className="rounded-lg border bg-muted/20 p-4">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold">
                          Table {table.table_number ?? index + 1}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {table.caption || getPageLabel(table.page)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {table.shape?.length === 2
                          ? `${table.shape[0]} x ${table.shape[1]}`
                          : `${rows.length} rows`}
                      </Badge>
                    </div>

                    {rows.length > 0 && columns.length > 0 ? (
                      <div className="overflow-x-auto rounded-md border bg-background">
                        <table className="w-full min-w-[520px] text-sm">
                          <thead className="bg-muted/60">
                            <tr>
                              {columns.map((column) => (
                                <th
                                  key={column}
                                  className="border-b px-3 py-2 text-left font-medium"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.slice(0, 5).map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b last:border-0">
                                {columns.map((column) => (
                                  <td
                                    key={column}
                                    className="max-w-[260px] px-3 py-2 align-top text-muted-foreground"
                                  >
                                    <span className="line-clamp-3">
                                      {toCellText(row[column])}
                                    </span>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
                        No table preview rows available.
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No tables found.
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {view === "raw" && (
        <ScrollArea className="min-h-[360px] rounded-lg border bg-muted/30 p-4 font-mono text-xs">
          <pre className="whitespace-pre-wrap">{rawJson || "No structure data found."}</pre>
        </ScrollArea>
      )}
    </div>
  );
}
