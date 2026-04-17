import type { ProductionPlanItem } from "./types";

export default function PlanItemCard({ item }: { item: ProductionPlanItem }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 px-4 py-3 text-xs space-y-1">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-indigo-400 font-medium">
          #{item.num}
        </span>
        <span className="text-gray-300 font-medium">{item.name}</span>
        <span className="text-gray-600 font-mono">{item.ratio}</span>
      </div>
      {item.headline && (
        <div className="text-gray-400">
          <span className="text-gray-600">카피:</span> {item.headline}
        </div>
      )}
      {item.subtext && (
        <div className="text-gray-500">
          <span className="text-gray-600">서브:</span> {item.subtext}
        </div>
      )}
      {item.layout_note && (
        <div className="text-gray-500">
          <span className="text-gray-600">레이아웃:</span> {item.layout_note}
        </div>
      )}
    </div>
  );
}
