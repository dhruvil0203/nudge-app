import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import {
  addLink as dbAddLink,
  updateLinkReminder as dbUpdateLinkReminder,
  markLinkComplete as dbMarkLinkComplete,
  updateLinkPriority as dbUpdateLinkPriority,
  getAllLinks,
  deleteLink as dbDeleteLink,
  clearCompletedLinks as dbClearCompletedLinks,
} from "../utils/database";
import type { Link, Priority } from "../types";

interface LinksContextType {
  pendingLinks: Link[];
  completedLinks: Link[];
  loading: boolean;
  error: string | null;
  loadLinks: () => Promise<void>;
  addLink: (url: string, title?: string | null, description?: string | null, image?: string | null, domain?: string | null, priority?: Priority) => Promise<Link>;
  updateReminder: (linkId: number, reminderType: string, reminderTime?: number | null, notificationId?: string | null) => Promise<void>;
  markComplete: (linkId: number) => Promise<void>;
  updatePriority: (linkId: number, priority: Priority) => Promise<void>;
  deleteLink: (linkId: number) => Promise<void>;
  clearCompleted: () => Promise<void>;
}

const LinksContext = createContext<LinksContextType | null>(null);

export const LinksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingLinks, setPendingLinks] = useState<Link[]>([]);
  const [completedLinks, setCompletedLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLinks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allLinks = await getAllLinks();
      setPendingLinks(
        allLinks
          .filter((l) => l.status === "pending")
          .sort((a, b) => b.created_at - a.created_at),
      );
      setCompletedLinks(
        allLinks
          .filter((l) => l.status === "completed")
          .sort((a, b) => (b.completed_at ?? 0) - (a.completed_at ?? 0)),
      );
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
      priority: Priority = "normal",
    ) => {
      try {
        setError(null);
        const newLink = await dbAddLink(url, title, description, image, domain, priority);
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
        await dbUpdateLinkReminder(linkId, reminderType, reminderTime, notificationId);
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
        setPendingLinks((prev) => prev.filter((l) => l.id !== linkId));
        const allLinks = await getAllLinks();
        setCompletedLinks(
          allLinks
            .filter((l) => l.status === "completed")
            .sort((a, b) => (b.completed_at ?? 0) - (a.completed_at ?? 0)),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to mark as complete";
        setError(errorMessage);
        console.error("Error marking as complete:", err);
        throw err;
      }
    },
    [],
  );

  const updatePriority = useCallback(
    async (linkId: number, priority: Priority) => {
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

  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadLinks();
    }
  }, [loadLinks]);

  return (
    <LinksContext.Provider
      value={{
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
      }}
    >
      {children}
    </LinksContext.Provider>
  );
};

export const useLinks = (): LinksContextType => {
  const context = useContext(LinksContext);
  if (!context) {
    throw new Error("useLinks must be used within a LinksProvider");
  }
  return context;
};
