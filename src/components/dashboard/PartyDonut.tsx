import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { PoliticalCount } from "@/lib/predictions";

const COLOR = {
  MACRON: "var(--color-primary)",
  "LE PEN": "#e11d48",
} as Record<string, string>;

export function PartyDonut({ title, data }: { title: string; data: PoliticalCount[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const safeData = data.filter((d) => d.count > 0);
  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <span className="text-xs text-muted-foreground">{total} départements</span>
      </div>
      <div className="relative h-56">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={safeData}
              dataKey="count"
              nameKey="party"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={3}
              stroke="none"
            >
              {safeData.map((d) => (
                <Cell key={d.party} fill={COLOR[d.party] ?? "var(--color-accent)"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                color: "#1e293b",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{safeData[0]?.count ?? 0}</span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{safeData[0]?.party}</span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {data.map((d) => (
          <div key={d.party} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR[d.party] ?? "var(--color-accent)" }} />
            {d.party} <span className="font-medium text-foreground">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}