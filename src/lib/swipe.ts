/**
 * Shared drag-to-commit thresholds for every swipe surface in the app: the
 * /browse card deck and the trip-detail image carousel. Kept framework-agnostic
 * (plain numbers in, direction out) so both can use it without a second
 * implementation of the same gesture maths.
 */
export const SWIPE_COMMIT_DISTANCE = 110;
export const SWIPE_COMMIT_VELOCITY = 500;

export type SwipeDirection = -1 | 0 | 1;

/**
 * Resolves a finished drag into a direction.
 *
 *  1 → dragged right (deck: interested / carousel: previous image)
 * -1 → dragged left  (deck: pass       / carousel: next image)
 *  0 → not far or fast enough; the caller should let it spring back.
 */
export function swipeDirection(offsetX: number, velocityX: number): SwipeDirection {
  const committed =
    Math.abs(offsetX) > SWIPE_COMMIT_DISTANCE || Math.abs(velocityX) > SWIPE_COMMIT_VELOCITY;
  if (!committed) return 0;
  return offsetX > 0 ? 1 : -1;
}
