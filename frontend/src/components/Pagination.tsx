"use client";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#eaeded]">
      <span className="text-xs text-[#545b64]">
        Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-2 py-1 text-xs border border-[#d5dbdb] rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#fafafa]"
        >
          ‹ Previous
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-2.5 py-1 text-xs border rounded ${
                pageNum === page
                  ? "bg-[#0972d3] text-white border-[#0972d3]"
                  : "border-[#d5dbdb] hover:bg-[#fafafa]"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-2 py-1 text-xs border border-[#d5dbdb] rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#fafafa]"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
