import { useState, useCallback } from "react";
import {
  addLink as dbAddLink,
  updateLinkReminder as dbUpdateLinkReminder,
  markLinkComplete as dbMarkLinkComplete,
  updateLinkPriority as dbUpdateLinkPriority,
  getPendingLinks,
  getCompletedLinks,
  deleteLink as dbDeleteLink,
  clearCompletedLinks as dbClearCompletedLinks,
  Link,
} from "../utils/database";

export const useLinks = () => {
  const [pendingLinks, setPendingLinks] = useState<Link[]>([]);
  const [completedLinks, setCompletedLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLinks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [pending, completed] = await Promise.all([
        getPendingLinks(),
        getCompletedLinks(),
      ]);
      setPendingLinks(pending);
      setCompletedLinks(completed);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load links";
      setError(errorMessage);
      console.error("Error loading links:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addLink = useCallback(
    async (
      url: string,
      title: string | null = null,
      description: string | null = null,
      image: string | null = null,
      domain: string | null = null,
      priority: string = "normal",
    ) => {
      try {
        setError(null);
        const newLink = await dbAddLink(
          url,
          title,
          description,
          image,
          domain,
          priority,
        );
        setPendingLinks((prev) => [newLink, ...prev]);
        return newLink;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add link";
        setError(errorMessage);
        console.error("Error adding link:", err);
        throw err;
      }
    },
    [],
  );

  const updateReminder = useCallback(
    async (
      linkId: number,
      reminderType: string,
      reminderTime: number | null = null,
      notificationId: string | null = null,
    ) => {
      try {
        setError(null);
        await dbUpdateLinkReminder(
          linkId,
          reminderType,
          reminderTime,
          notificationId,
        );
        setPendingLinks((prev) =>
          prev.map((link) =>
            link.id === linkId
              ? {
                  ...link,
                  reminder_type: reminderType,
                  reminder_time: reminderTime,
                  notification_id: notificationId,
                }
              : link,
          ),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update reminder";
        setError(errorMessage);
        console.error("Error updating reminder:", err);
        throw err;
      }
    },
    [],
  );

  const markComplete = useCallback(
    async (linkId: number) => {
      try {
        setError(null);
        await dbMarkLinkComplete(linkId);
        const completedLink = pendingLinks.find((l) => l.id === linkId);
        if (completedLink) {
          const updated = {
            ...completedLink,
            status: "completed" as const,
            completed_at: Date.now(),
          };
          setPendingLinks((prev) => prev.filter((l) => l.id !== linkId));
          setCompletedLinks((prev) => [updated, ...prev]);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to mark as complete";
        setError(errorMessage);
        console.error("Error marking as complete:", err);
        throw err;
      }
    },
    [pendingLinks],
  );

  const updatePriority = useCallback(
    async (linkId: number, priority: string) => {
      try {
        setError(null);
        await dbUpdateLinkPriority(linkId, priority);
        setPendingLinks((prev) =>
          prev.map((link) =>
            link.id === linkId ? { ...link, priority } : link,
          ),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update priority";
        setError(errorMessage);
        console.error("Error updating priority:", err);
        throw err;
      }
    },
    [],
  );

  const deleteLink = useCallback(async (linkId: number) => {
    try {
      setError(null);
      await dbDeleteLink(linkId);
      setPendingLinks((prev) => prev.filter((l) => l.id !== linkId));
      setCompletedLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete link";
      setError(errorMessage);
      console.error("Error deleting link:", err);
      throw err;
    }
  }, []);

  const clearCompleted = useCallback(async () => {
    try {
      setError(null);
      await dbClearCompletedLinks();
      setCompletedLinks([]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to clear completed";
      setError(errorMessage);
      console.error("Error clearing completed:", err);
      throw err;
    }
  }, []);

  return {
    pendingLinks,
    completedLinks,
    loading,
    error,
    loadLinks,
    addLink,
    updateReminder,
    markComplete,
    updatePriority,
    deleteLink,
    clearCompleted,
  };
};
