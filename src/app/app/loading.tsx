export default function Loading() {
  return <div aria-label="Laden" className="animate-pulse"><div className="h-8 w-40 rounded bg-[#e8e8e4]"/><div className="mt-8 h-20 rounded-[12px] bg-[#ecece8]"/><div className="mt-7 space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-16 rounded-[10px] bg-[#eeeeea]"/>)}</div></div>;
}
