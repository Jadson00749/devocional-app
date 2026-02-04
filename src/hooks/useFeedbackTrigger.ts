import { useState, useEffect, useCallback } from 'react';
import { User, FeedbackTriggerType } from '../types';
import { databaseService } from '../services/databaseService';

export const useFeedbackTrigger = (user: User | null) => {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerType, setTriggerType] = useState<FeedbackTriggerType>('7_days');
  const [hasChecked, setHasChecked] = useState(false);

  const checkFeedbackEligibility = useCallback(async () => {
    if (!user || hasChecked) return;

    try {
      // 1. Check if user meets basic criteria (e.g. 7 day streak)
      // We can also check for total check-ins if available, or just use streak
      const isEligibleStreak = user.streak >= 7;
      
      if (!isEligibleStreak) {
        setHasChecked(true);
        return;
      }

      // 2. Fetch tracking data
      const tracking = await databaseService.getFeedbackTracking(user.id);
      
      const now = new Date();
      const lastFeedback = tracking?.last_feedback_date ? new Date(tracking.last_feedback_date) : null;
      const lastDismissed = tracking?.last_dismissed_date ? new Date(tracking.last_dismissed_date) : null;

      // 3. Check time intervals
      
      // If already gave feedback, wait 30 days
      if (lastFeedback) {
        const daysSinceFeedback = (now.getTime() - lastFeedback.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceFeedback < 30) {
          setHasChecked(true);
          return;
        }
      }

      // If dismissed, wait 7 days
      if (lastDismissed) {
        const daysSinceDismissed = (now.getTime() - lastDismissed.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
          setHasChecked(true);
          return;
        }
      }

      // 4. Trigger feedback
      setTriggerType(user.streak >= 30 ? '30_days' : '7_days');
      setIsOpen(true);
      setHasChecked(true);

    } catch (error) {
      console.error('Error checking feedback eligibility:', error);
      setHasChecked(true);
    }
  }, [user, hasChecked]);

  // Check on mount if user is loaded, or when streak changes
  useEffect(() => {
    if (user) {
      checkFeedbackEligibility();
    }
  }, [user, checkFeedbackEligibility]);

  const handleClose = async (action: 'submit' | 'dismiss' = 'dismiss') => {
    setIsOpen(false);
    if (user) {
      await databaseService.updateFeedbackTracking(user.id, action);
    }
  };

  const forceOpen = () => {
    setTriggerType('7_days');
    setIsOpen(true);
  };

  return {
    isOpen,
    triggerType,
    handleClose,
    checkFeedbackEligibility, // Expose in case we want to manually trigger
    forceOpen
  };
};
