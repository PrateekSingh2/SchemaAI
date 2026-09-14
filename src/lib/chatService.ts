import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { ChatOperation } from "@/components/QueryStudio/ChatHistoryPanel";

/**
 * Saves or updates a chat operation in Firestore under:
 * /users/{userId}/chats/{operation.id}
 */
export async function saveChatSessionToFirestore(
  userId: string,
  operation: ChatOperation
): Promise<void> {
  if (!userId) return;

  const saveToLocal = () => {
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
  };

  if (!isFirebaseConfigured || userId.startsWith("usr_demo_")) {
    saveToLocal();
    return;
  }

  try {
    const chatDocRef = doc(db, "users", userId, "chats", operation.id);
    
    // Clean undefined fields to satisfy Firestore requirements
    const cleanTurns = (operation.turns || []).map((t) => ({
      id: t.id,
      userPrompt: t.userPrompt || "",
      timestamp: t.timestamp || "",
      sql: t.sql || "",
      graphql: t.graphql || null,
      queryFormat: t.queryFormat || "sql",
      hasRun: Boolean(t.hasRun),
      records: t.records || [],
      columns: t.columns || [],
      executionTime: t.executionTime || 0,
      tokens: t.tokens || 0,
      cost: t.cost || "$0.0000",
    }));

    await setDoc(
      chatDocRef,
      {
        id: operation.id,
        prompt: operation.prompt,
        sql: operation.sql,
        graphql: operation.graphql || null,
        timestamp: operation.timestamp || "Just now",
        format: operation.format || "sql",
        status: operation.status || "generated",
        rowCount: operation.rowCount || 0,
        turns: cleanTurns,
        userId: userId,
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
    const q = query(userChatsRef, orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);

    const operations: ChatOperation[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      operations.push({
        id: data.id || docSnap.id,
        prompt: data.prompt,
        sql: data.sql,
        graphql: data.graphql,
        timestamp: data.timestamp,
        format: data.format || "sql",
        status: data.status || "generated",
        rowCount: data.rowCount,
        turns: data.turns || [],
      });
    });

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

  if (!isFirebaseConfigured) {
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
    return;
  }

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

  if (!isFirebaseConfigured) {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`schemaai_chats_${userId}`);
      }
    } catch (e) {
      console.warn("Local storage clear error:", e);
    }
    return;
  }

  try {
    await Promise.all(
      chatIds.map((id) => deleteDoc(doc(db, "users", userId, "chats", id)))
    );
  } catch (error) {
    console.error("Failed to clear all chat sessions from Firestore:", error);
  }
}
