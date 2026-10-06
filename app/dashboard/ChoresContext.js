"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ChoresContext = createContext(null);

async function readResponse(response, fallbackMessage) {
  let body;
  try {
    body = await response.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }

  if (!response.ok) {
    throw new Error(body?.error || fallbackMessage);
  }

  return body;
}

async function fetchChores() {
  const response = await fetch("/api/chores", { cache: "no-store" });
  const data = await readResponse(response, "Could not load chores.");
  if (!Array.isArray(data)) {
    throw new Error("The chores response was invalid.");
  }

  return data.map((chore) => ({ ...chore, done: false }));
}

export function ChoresProvider({ children }) {
  const [chores, setChores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadChores = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setChores(await fetchChores());
    } catch (loadError) {
      setError(loadError.message || "Could not load chores.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchChores()
      .then((data) => {
        if (isMounted) setChores(data);
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(loadError.message || "Could not load chores.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const addChore = useCallback(async (choreName, date) => {
    const response = await fetch("/api/chores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choreName, date }),
    });
    const newChore = await readResponse(response, "Could not add chore.");
    setChores((current) => [...current, { ...newChore, done: false }]);
  }, []);

  const editChore = useCallback(async (id, choreName, date) => {
    const response = await fetch(`/api/chores/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choreName, date }),
    });
    const updatedChore = await readResponse(response, "Could not update chore.");
    setChores((current) =>
      current.map((chore) =>
        chore.id === id ? { ...updatedChore, done: chore.done } : chore,
      ),
    );
  }, []);

  const removeChore = useCallback(async (id) => {
    const response = await fetch(`/api/chores/${id}`, { method: "DELETE" });
    await readResponse(response, "Could not delete chore.");
    setChores((current) => current.filter((chore) => chore.id !== id));
  }, []);

  const toggleChore = useCallback((id) => {
    setChores((current) =>
      current.map((chore) =>
        chore.id === id ? { ...chore, done: !chore.done } : chore,
      ),
    );
  }, []);

  return (
    <ChoresContext.Provider
      value={{
        chores,
        isLoading,
        error,
        loadChores,
        addChore,
        editChore,
        removeChore,
        toggleChore,
      }}
    >
      {children}
    </ChoresContext.Provider>
  );
}

export function useChores() {
  const context = useContext(ChoresContext);
  if (!context) {
    throw new Error("useChores must be used inside a <ChoresProvider>");
  }
  return context;
}
