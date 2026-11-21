import { STATUS_LABEL, type RequestStatus } from "@/types/database";

const STYLE: Record<RequestStatus, string> = {
  pending: "border border-slate-300 bg-white text-slate-700",
  quote: "border border-transparent bg-brand-100 text-brand-800",
  active: "border border-transparent bg-brand-600 text-white",
  done: "border border-transparent bg-success-bg text-success",
};

/** 상태 표시(글자가 함께 있어 색만으로 구분하지 않는다) */
export function StatusBadge({ status, className = "" }: { status: RequestStatus; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${STYLE[status]} ${className}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
