export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-36 bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded-full w-3/4" />
        <div className="h-3 bg-gray-200 rounded-full w-1/2" />
        <div className="h-3 bg-gray-200 rounded-full w-2/3" />
      </div>
    </div>
  );
}
