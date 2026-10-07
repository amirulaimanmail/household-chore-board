"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CirclePlus, LogOut, Trash2, Users, X } from "lucide-react";
import { getSession, signOut } from "next-auth/react";
import { ChoresProvider, useChores } from "./ChoresContext";
import WeatherCard from "./WeatherCard";

function getLocalDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [sessionName, setSessionName] = useState("");

  useEffect(() => {
    getSession()
      .then((session) => {
        if (!session) {
          router.replace("/login");
          return;
        }
        if (!session.user?.name) {
          setSessionError("Your session does not have a household name.");
          return;
        }
        setSessionName(session.user.name);
        setIsReady(true);
      })
      .catch(() => {
        setSessionError("Unable to verify your session. Please try again.");
      });
  }, [router]);

  if (sessionError) {
    return (
      <main className="auth-page">
        <p className="auth-error" role="alert">
          {sessionError}
        </p>
      </main>
    );
  }

  if (!isReady) {
    return (
      <main className="auth-page" aria-live="polite">
        <p>Loading your household…</p>
      </main>
    );
  }

  return (
    <ChoresProvider>
      <DashboardBoard sessionName={sessionName} />
    </ChoresProvider>
  );
}

function DashboardBoard({ sessionName }) {
  const {
    chores,
    isLoading,
    error,
    loadChores,
    addChore,
    removeChore,
    toggleChore,
  } = useChores();
  const [showAdd, setShowAdd] = useState(false);
  const [newChore, setNewChore] = useState("");
  const [newChoreDate, setNewChoreDate] = useState(getLocalDate);
  const [actionError, setActionError] = useState("");
  const remaining = chores.filter((chore) => !chore.done).length;
  const today = getLocalDate();
  const grouped = useMemo(
    () => ({
      today: chores.filter((chore) => chore.date === today),
      later: chores.filter((chore) => chore.date !== today),
    }),
    [chores, today],
  );

  async function handleAddChore() {
    if (!newChore.trim()) return;
    setActionError("");
    try {
      await addChore(newChore.trim(), newChoreDate);
      setNewChore("");
      setNewChoreDate(getLocalDate());
      setShowAdd(false);
    } catch (error) {
      setActionError(error.message || "Could not add chore.");
    }
  }

  async function handleDeleteChore(id, choreName) {
    if (!window.confirm(`Delete "${choreName}"?`)) return;
    setActionError("");
    try {
      await removeChore(id);
    } catch (error) {
      setActionError(error.message || "Could not delete chore.");
    }
  }

  if (isLoading) {
    return (
      <main className="auth-page" aria-live="polite">
        <p>Loading your chores…</p>
      </main>
    );
  }

  return (
    <main className="simple-board">
      <header className="simple-header">
        <div className="simple-brand">
          <span className="simple-mark">
            <Users />
          </span>
          <span>Our chores</span>
        </div>
        <div className="household">
          <span>{sessionName}</span>
          <button
            className="simple-logout"
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Log out"
          >
            <LogOut />
          </button>
        </div>
      </header>
      <section className="simple-content">
        <div className="simple-intro">
          <div>
            <p className="simple-kicker">Shared household</p>
            <h1>Chore board</h1>
            <p className="simple-muted">Keep the home running together.</p>
          </div>
          <button className="simple-primary" onClick={() => setShowAdd(true)}>
            <CirclePlus /> Add chore
          </button>
        </div>
        <WeatherCard />
        <section className="simple-summary">
          <strong>{remaining}</strong>
          <span>chores left this week</span>
          <div className="simple-progress">
            <span
              style={{
                width: `${chores.length ? ((chores.length - remaining) / chores.length) * 100 : 0}%`,
              }}
            />
          </div>
        </section>
        {(error || actionError) && (
          <div className="auth-error" role="alert">
            <p>{actionError || error}</p>
            {error && (
              <button className="simple-secondary" onClick={loadChores}>
                Try again
              </button>
            )}
          </div>
        )}
        <div className="simple-list">
          <section>
            <div className="simple-section-title">
              <h2>Today</h2>
              <span>{grouped.today.length}</span>
            </div>
            <div className="simple-card">
              {grouped.today.map((chore) => (
                <ChoreRow
                  key={chore.id}
                  chore={chore}
                  onToggle={toggleChore}
                  onDelete={handleDeleteChore}
                />
              ))}
            </div>
          </section>
          <section>
            <div className="simple-section-title">
              <h2>Coming up</h2>
              <span>{grouped.later.length}</span>
            </div>
            <div className="simple-card">
              {grouped.later.map((chore) => (
                <ChoreRow
                  key={chore.id}
                  chore={chore}
                  onToggle={toggleChore}
                  onDelete={handleDeleteChore}
                />
              ))}
            </div>
          </section>
        </div>
      </section>
      {showAdd && (
        <div
          className="simple-modal-backdrop"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="simple-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="simple-modal-top">
              <div>
                <p className="simple-kicker">New task</p>
                <h2 id="add-title">Add a chore</h2>
              </div>
              <button
                className="simple-close"
                onClick={() => setShowAdd(false)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>
            <label htmlFor="chore-name">What needs doing?</label>
            <input
              id="chore-name"
              style={{ marginBottom: "20px" }}
              autoFocus
              value={newChore}
              onChange={(event) => setNewChore(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleAddChore();
              }}
              placeholder="e.g. Water the plants"
            />
            
            <label htmlFor="chore-date">When is it due?</label>
            <input
              id="chore-date"
              type="date"
              value={newChoreDate}
              onChange={(event) => setNewChoreDate(event.target.value)}
              required
            />
            <div className="simple-modal-actions">
              <button
                className="simple-secondary"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
              <button className="simple-primary" onClick={handleAddChore}>
                Add chore
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ChoreRow({ chore, onToggle, onDelete }) {
  return (
    <div className={`simple-row ${chore.done ? "done" : ""}`}>
      <button
        className={`simple-check ${chore.done ? "checked" : ""}`}
        onClick={() => onToggle(chore.id)}
        aria-label={`${chore.done ? "Mark" : "Complete"} ${chore.choreName}`}
      >
        {chore.done && <Check />}
      </button>
      <div className="simple-row-text">
        <strong>{chore.choreName}</strong>
        <span>{chore.date === getLocalDate() ? "Today" : chore.date}</span>
      </div>
      <div className="simple-row-actions">
        <button
          className="simple-more"
          onClick={() => onDelete(chore.id, chore.choreName)}
          aria-label={`Delete ${chore.choreName}`}
        >
          <Trash2 />
        </button>
      </div>
    </div>
  );
}
