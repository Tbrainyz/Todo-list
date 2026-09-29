"use client";
import { useEffect, useState } from "react";
import type { Todo } from "@/lib/types";

const KEY = "remindersEnabled";
const today = () => new Date().toISOString().slice(0, 10);

/** Client-side due-today reminders via the browser Notification API. Nothing is sent to a server. */
export function useReminders(todos: Todo[]) {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "Notification" in window);
    setEnabled(localStorage.getItem(KEY) === "true" && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted");
  }, []);

  const toggle = async () => {
    if (!supported) return;
    if (enabled) { setEnabled(false); localStorage.setItem(KEY, "false"); return; }
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm === "granted") { setEnabled(true); localStorage.setItem(KEY, "true"); }
  };

  useEffect(() => {
    if (!enabled) return;
    const fired = new Set<string>();
    const check = () => {
      for (const t of todos) {
        if (!t.completed && t.dueDate === today() && !fired.has(t.id)) {
          fired.add(t.id);
          new Notification("Task due today", { body: t.title, tag: t.id });
        }
      }
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [enabled, todos]);

  return { supported, enabled, toggle };
}
