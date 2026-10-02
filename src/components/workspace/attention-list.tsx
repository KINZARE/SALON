import Link from "next/link";
import type { TodayAttention } from "@/services/today-workspace";

export function AttentionList({ items }: { items: TodayAttention[] }) {
  if (!items.length) return null;
  return <section>
    <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--warning)]"/><h2 className="text-sm font-semibold">Aandacht nodig</h2></div>
    <div className="mt-3 overflow-hidden rounded-[20px] border border-[#eadfc9] bg-[#fcf7ec]">
      {items.map((item,index)=><Link key={`${item.kind}-${index}`} href={item.href} className={`flex min-h-12 items-center justify-between gap-3 px-4 py-3 text-sm ${index ? "border-t border-[#eadfc9]" : ""}`}>
        <span>{item.label}</span><span className="text-[var(--muted)]">→</span>
      </Link>)}
    </div>
  </section>;
}