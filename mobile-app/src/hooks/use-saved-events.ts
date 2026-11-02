import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { getSavedEventIds, removeSavedEvent, saveEvent } from "../services/saved-events";

export function useSavedEvents(userId?: string) {
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());
  const [savedOwnerId, setSavedOwnerId] = useState<string | null>(null);
  const [savingEventId, setSavingEventId] = useState<string | null>(null);
  const [savedEventsError, setSavedEventsError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!userId) return () => { active = false; };

      getSavedEventIds(userId)
        .then((eventIds) => {
          if (active) {
            setSavedEventIds(new Set(eventIds));
            setSavedOwnerId(userId);
            setSavedEventsError(null);
          }
        })
        .catch((error) => {
          if (active) {
          setSavedEventIds(new Set());
            setSavedOwnerId(userId);
            setSavedEventsError(
              error instanceof Error ? error.message : "Could not load your saved events."
            );
          }
        });

      return () => {
        active = false;
      };
    }, [userId])
  );

  const toggleSavedEvent = useCallback(
    async (eventId: string): Promise<boolean> => {
      if (!userId) throw new Error("Sign in to save events.");
      const currentSavedIds = savedOwnerId === userId ? savedEventIds : new Set<string>();
      if (savingEventId) return currentSavedIds.has(eventId);

      setSavingEventId(eventId);
      setSavedEventsError(null);
      try {
        if (currentSavedIds.has(eventId)) {
          await removeSavedEvent(userId, eventId);
          setSavedEventIds((current) => {
            const next = new Set(current);
            next.delete(eventId);
            return next;
          });
          setSavedOwnerId(userId);
          return false;
        }

        await saveEvent(userId, eventId);
        setSavedEventIds((current) => new Set(current).add(eventId));
        setSavedOwnerId(userId);
        return true;
      } catch (error) {
        setSavedEventsError(
          error instanceof Error ? error.message : "Could not update your saved events."
        );
        throw error;
      } finally {
        setSavingEventId(null);
      }
    },
    [savedEventIds, savedOwnerId, savingEventId, userId]
  );

  return {
    savedEventIds: savedOwnerId === userId ? savedEventIds : new Set<string>(),
    loadingSavedEvents: Boolean(userId && savedOwnerId !== userId),
    savingEventId,
    savedEventsError,
    toggleSavedEvent,
  };
}
