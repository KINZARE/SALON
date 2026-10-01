export default function Loading() {
  return (
    <div aria-label="Laden" className="animate-pulse">
      <div className="h-3 w-20 rounded-full bg-[var(--surface-2)]" />
      <div className="mt-3 h-12 w-52 max-w-full rounded-[18px] bg-[var(--surface)]" />
      <div className="mt-8 h-32 rounded-[var(--radius-card-sm)] bg-[var(--surface)]" />
      <div className="mt-8 space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[72px] rounded-[var(--radius-control)] bg-[var(--surface)]" />
        ))}
      </div>
    </div>
  );
}
