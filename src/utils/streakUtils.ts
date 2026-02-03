import { differenceInCalendarDays, isSameDay, parseISO, startOfDay } from 'date-fns';
import { DevotionalPost } from '../types';

/**
 * Calculates the current and max streak based on devotional posts.
 * @param posts List of user's devotional posts
 * @returns Object containing currentStreak and maxStreak
 */
export const calculateUserStreak = (posts: DevotionalPost[]): { currentStreak: number; maxStreak: number } => {
  if (!posts || posts.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }

  // 1. Extract unique dates (normalized to start of day)
  const dates = posts
    .map(post => startOfDay(new Date(post.date)))
    .sort((a, b) => b.getTime() - a.getTime()); // Newest first

  if (dates.length === 0) return { currentStreak: 0, maxStreak: 0 };

  // Remove duplicates (multiple posts on same day count as 1 day)
  const uniqueDates: Date[] = [];
  dates.forEach(date => {
    if (uniqueDates.length === 0 || !isSameDay(date, uniqueDates[uniqueDates.length - 1])) {
      uniqueDates.push(date);
    }
  });

  // 2. Calculate Current Streak
  let currentStreak = 0;
  const today = startOfDay(new Date());
  const yesterday = startOfDay(new Date());
  yesterday.setDate(yesterday.getDate() - 1);

  const mostRecentPost = uniqueDates[0];
  
  // Streak is active if the most recent post is Today or Yesterday
  // If the last post was 2 days ago, the streak is broken (0)
  if (isSameDay(mostRecentPost, today) || isSameDay(mostRecentPost, yesterday)) {
    currentStreak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = uniqueDates[i];
        const next = uniqueDates[i+1]; // older date
        
        const diff = differenceInCalendarDays(current, next);
        
        if (diff === 1) {
            currentStreak++;
        } else {
            break; // Streak broken
        }
    }
  }

  // 3. Calculate Historical Max Streak
  let maxStreak = 0;
  let tempStreak = 1;

  if (uniqueDates.length === 0) {
      maxStreak = 0;
  } else {
      // Iterate through all dates to find the longest sequence
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = uniqueDates[i];
        const next = uniqueDates[i+1];
        const diff = differenceInCalendarDays(current, next);

        if (diff === 1) {
            tempStreak++;
        } else {
            // Sequence ended
            if (tempStreak > maxStreak) {
                maxStreak = tempStreak;
            }
            tempStreak = 1; // Reset
        }
      }
      // Check the last sequence
      if (tempStreak > maxStreak) {
          maxStreak = tempStreak;
      }
  }

  // Safety check: Max streak cannot be less than current streak
  if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
  }

  return { currentStreak, maxStreak };
};
