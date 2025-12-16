import React from "react";

export default function Pagination({ page, totalPages, setPage }) {
  const safeTotal = Math.max(1, Number(totalPages) || 1);
  const safePage = Math.min(Math.max(1, Number(page) || 1), safeTotal);

  const canPrev = safePage > 1;
  const canNext = safePage < safeTotal;

  const go = (p) => {
    const next = Math.min(Math.max(1, p), safeTotal);
    if (next !== safePage) setPage(next);
  };

  const windowSize = 5;
  const start = Math.max(1, safePage - Math.floor(windowSize / 2));
  const end = Math.min(safeTotal, start + windowSize - 1);
  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div
      className="flex items-center justify-between gap-2 flex-wrap mt-6 p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20"
      dir="rtl"
    >
      <div className="text-sm text-gray-300">
        صفحة {safePage} من {safeTotal}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => go(1)}
          disabled={!canPrev}
          className="px-3 py-1.5 rounded-xl border border-white/20 disabled:opacity-50 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white transition-all duration-300"
        >
          الأولى
        </button>
        <button
          onClick={() => go(safePage - 1)}
          disabled={!canPrev}
          className="px-3 py-1.5 rounded-xl border border-white/20 disabled:opacity-50 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white transition-all duration-300"
        >
          السابق
        </button>
        <div className="flex items-center gap-1">
          {start > 1 ? <span className="px-2 text-gray-400">…</span> : null}
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => go(p)}
              className={
                p === safePage
                  ? "px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25"
                  : "px-3 py-1.5 rounded-xl border border-white/20 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white transition-all duration-300"
              }
            >
              {p}
            </button>
          ))}
          {end < safeTotal ? (
            <span className="px-2 text-gray-400">…</span>
          ) : null}
        </div>
        <button
          onClick={() => go(safePage + 1)}
          disabled={!canNext}
          className="px-3 py-1.5 rounded-xl border border-white/20 disabled:opacity-50 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white transition-all duration-300"
        >
          التالي
        </button>
        <button
          onClick={() => go(safeTotal)}
          disabled={!canNext}
          className="px-3 py-1.5 rounded-xl border border-white/20 disabled:opacity-50 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white transition-all duration-300"
        >
          الأخيرة
        </button>
      </div>
    </div>
  );
}
