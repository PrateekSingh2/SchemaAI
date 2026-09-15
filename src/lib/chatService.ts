import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { ChatOperation, ChatMessageTurn } from "@/components/QueryStudio/ChatHistoryPanel";
import { AuditLogEntry } from "./mockData";

/**
 * Saves or updates a chat operation in Firestore under:
 * /users/{userId}/chats/{operation.id}
 */
export async function saveChatSessionToFirestore(
  userId: string,
  operation: ChatOperation
): Promise<void> {
  if (!userId || !operation?.id) return;

  // 1. Always update local storage cache immediately for offline resilience
  try {
    if (typeof window !== "undefined") {
      const localData = localStorage.getItem(`schemaai_chats_${userId}`);
      const parsed: ChatOperation[] = localData ? JSON.parse(localData) : [];
      const index = parsed.findIndex((c) => c.id === operation.id);
      if (index >= 0) {
        parsed[index] = operation;
      } else {
        parsed.unshift(operation);
      }
      localStorage.setItem(`schemaai_chats_${userId}`, JSON.stringify(parsed));
    }
  } catch (e) {
    console.warn("Local storage fallback save error:", e);
  }

  // 2. Persist to Firestore if configured
  if (!isFirebaseConfigured || userId.startsWith("usr_demo_")) {
    return;
  }

  try {
    const chatDocRef = doc(db, "users", userId, "chats", operation.id);

    // Clean and sanitize turns array to satisfy Firestore data restrictions
    const cleanTurns: ChatMessageTurn[] = (operation.turns || []).map((t) => ({
      id: t.id || `turn-${Date.now()}`,
      userPrompt: t.userPrompt || "",
      timestamp: t.timestamp || "Just now",
      sql: t.sql || "",
      graphql: t.graphql || "",
      queryFormat: t.queryFormat || "sql",
      type: t.type || "sql",
      textContent: t.textContent || "",
      hasRun: Boolean(t.hasRun),
      records: Array.isArray(t.records) ? t.records.slice(0, 100) : [],
      columns: Array.isArray(t.columns) ? t.columns : [],
      executionTime: t.executionTime || 0,
      tokens: t.tokens || 0,
      cost: t.cost || "$0.0000",
    }));

    await setDoc(
      chatDocRef,
      {
        id: operation.id,
        prompt: operation.prompt || "",
        sql: operation.sql || "",
        graphql: operation.graphql || "",
        timestamp: operation.timestamp || "Just now",
        format: operation.format || "sql",
        type: operation.type || "sql",
        textContent: operation.textContent || "",
        status: operation.status || "generated",
        rowCount: operation.rowCount || 0,
        records: Array.isArray(operation.records) ? operation.records.slice(0, 100) : [],
        columns: Array.isArray(operation.columns) ? operation.columns : [],
        executionTime: operation.executionTime || 0,
        turns: cleanTurns,
        userId: userId,
        updatedAtMillis: Date.now(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to save chat session to Firestore:", error);
  }
}

/**
 * Fetches all chat sessions for a specific user from Firestore:
 * /users/{userId}/chats
 */
export async function getUserChatSessionsFromFirestore(
  userId: string
): Promise<ChatOperation[]> {
  if (!userId) return [];

  const readFromLocal = (): ChatOperation[] => {
    try {
      if (typeof window !== "undefined") {
        const localData = localStorage.getItem(`schemaai_chats_${userId}`);
        return localData ? JSON.parse(localData) : [];
      }
    } catch (e) {
      console.warn("Local storage fallback read error:", e);
    }
    return [];
  };

  if (!isFirebaseConfigured || userId.startsWith("usr_demo_")) {
    return readFromLocal();
  }

  try {
    const userChatsRef = collection(db, "users", userId, "chats");
    const snapshot = await getDocs(userChatsRef);

    if (snapshot.empty) {
      return readFromLocal();
    }

    const operations: (ChatOperation & { updatedAtMillis?: number })[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      operations.push({
        id: data.id || docSnap.id,
        prompt: data.prompt || "Database Query",
        sql: data.sql || "",
        graphql: data.graphql || "",
        timestamp: data.timestamp || "Just now",
        format: data.format || "sql",
        type: data.type || "sql",
        textContent: data.textContent || "",
        status: data.status || "generated",
        rowCount: data.rowCount || 0,
        records: Array.isArray(data.records) ? data.records : [],
        columns: Array.isArray(data.columns) ? data.columns : [],
        executionTime: data.executionTime || 0,
        turns: Array.isArray(data.turns) ? data.turns : [],
        updatedAtMillis: data.updatedAtMillis || (data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now()),
      });
    });

    // Sort by latest updated descending
    operations.sort((a, b) => (b.updatedAtMillis || 0) - (a.updatedAtMillis || 0));

    // Cache to localStorage for fast subsequent renders
    if (typeof window !== "undefined" && operations.length > 0) {
      try {
        localStorage.setItem(`schemaai_chats_${userId}`, JSON.stringify(operations));
      } catch (_) {}
    }

    return operations;
  } catch (error) {
    console.warn("Failed to fetch user chat sessions from Firestore, falling back to local:", error);
    return readFromLocal();
  }
}

/**
 * Deletes a specific chat session document:
 * /users/{userId}/chats/{chatId}
 */
export async function deleteUserChatSessionFromFirestore(
  userId: string,
  chatId: string
): Promise<void> {
  if (!userId || !chatId) return;

  try {
    if (typeof window !== "undefined") {
      const localData = localStorage.getItem(`schemaai_chats_${userId}`);
      if (localData) {
        const parsed: ChatOperation[] = JSON.parse(localData);
        const filtered = parsed.filter((c) => c.id !== chatId);
        localStorage.setItem(`schemaai_chats_${userId}`, JSON.stringify(filtered));
      }
    }
  } catch (e) {
    console.warn("Local storage fallback delete error:", e);
  }

  if (!isFirebaseConfigured || userId.startsWith("usr_demo_")) return;

  try {
    const chatDocRef = doc(db, "users", userId, "chats", chatId);
    await deleteDoc(chatDocRef);
  } catch (error) {
    console.error("Failed to delete chat session from Firestore:", error);
  }
}

/**
 * Clears all chat sessions for the user
 */
export async function clearAllUserChatSessionsFromFirestore(
  userId: string,
  chatIds: string[]
): Promise<void> {
  if (!userId) return;

  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`schemaai_chats_${userId}`);
    }
  } catch (e) {
    console.warn("Local storage clear error:", e);
  }

  if (!isFirebaseConfigured || userId.startsWith("usr_demo_")) return;

  try {
    await Promise.all(
      chatIds.map((id) => deleteDoc(doc(db, "users", userId, "chats", id)))
    );
  } catch (error) {
    console.error("Failed to clear all chat sessions from Firestore:", error);
  }
}

/**
 * Saves an Audit Log entry to Firestore:
 * /users/{userId}/audit_logs/{logEntry.id}
 */
export async function saveAuditLogToFirestore(
  userId: string,
  logEntry: AuditLogEntry
): Promise<void> {
  if (!userId || !logEntry?.id) return;

  // 1. Always save to user-scoped localStorage for instant offline access
  try {
    if (typeof window !== "undefined") {
      const userLogsKey = `schemaai_audit_logs_${userId}`;
      const prev = JSON.parse(localStorage.getItem(userLogsKey) || "[]");
      const updated = [logEntry, ...(Array.isArray(prev) ? prev.filter((l: any) => l.id !== logEntry.id) : [])].slice(0, 100);
      localStorage.setItem(userLogsKey, JSON.stringify(updated));
    }
  } catch (_) {}

  // 2. Persist to Firestore if configured
  if (!isFirebaseConfigured || userId.startsWith("usr_demo_")) return;

  try {
    const logDocRef = doc(db, "users", userId, "audit_logs", logEntry.id);
    await setDoc(
      logDocRef,
      {
        ...logEntry,
        userId,
        timestampMillis: Date.now(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (_) {
    // Silently continue with localStorage fallback if Firestore security rules block access
  }
}

/**
 * Fetches all Audit Logs from Firestore with automatic fallback to localStorage
 */
export async function getUserAuditLogsFromFirestore(
  userId: string
): Promise<AuditLogEntry[]> {
  const readFromLocal = (): AuditLogEntry[] => {
    try {
      if (typeof window !== "undefined") {
        const userLogsKey = `schemaai_audit_logs_${userId}`;
        const localData = localStorage.getItem(userLogsKey) || localStorage.getItem("schemaai_audit_logs");
        return localData ? JSON.parse(localData) : [];
      }
    } catch (_) {}
    return [];
  };

  if (!userId || !isFirebaseConfigured || userId.startsWith("usr_demo_")) {
    return readFromLocal();
  }

  try {
    const logsRef = collection(db, "users", userId, "audit_logs");
    const snapshot = await getDocs(logsRef);

    if (snapshot.empty) return readFromLocal();

    const logs: (AuditLogEntry & { timestampMillis?: number })[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      logs.push({
        id: data.id || docSnap.id,
        timestamp: data.timestamp || new Date().toISOString(),
        ipAddress: data.ipAddress || "127.0.0.1",
        userPrompt: data.userPrompt || "",
        generatedSql: data.generatedSql || "",
        status: data.status || "SUCCESS",
        durationMs: data.durationMs || 25,
        rowsAffected: data.rowsAffected || 0,
        model: data.model || "GPT-4o",
        clientDevice: data.clientDevice || "Browser Client",
        timestampMillis: data.timestampMillis || Date.now(),
      });
    });

    logs.sort((a, b) => (b.timestampMillis || 0) - (a.timestampMillis || 0));
    return logs;
  } catch (_) {
    // If Firestore rules deny permission, gracefully return local storage logs
    return readFromLocal();
  }
}
