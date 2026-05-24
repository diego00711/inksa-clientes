import { CardSkeleton } from './CardSkeleton';

export function RestaurantSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}
