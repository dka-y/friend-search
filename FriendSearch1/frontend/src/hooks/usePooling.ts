import { useEffect, useRef, useCallback } from "react";

/**
 * usePolling — calls a callback on a fixed interval.
 * Used in ChatPage to poll for new messages every few seconds.
 * Automatically pauses when the tab is hidden and resumes when visible.
 *
 * @param callback  - async function to call on each tick
 * @param interval  - ms between calls (default 2500ms)
 * @param enabled   - set false to pause polling (e.g. no active conversation)
 *
 * Usage:
 *   usePolling(async () => {
 *     const data = await chatApi.pollMessages(otherId, lastTimestamp);
 *     if (data.messages.length) setMessages(prev => [...prev, ...data.messages]);
 *   }, 2500, !!activeConversation);
 */
export function usePolling(
  callback: () => Promise<void>,
  interval = 2500,
  enabled  = true
): void {
  const savedCallback = useRef(callback);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  // Always keep the ref pointing to the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      savedCallback.current();
    }, interval);
  }, [interval]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start / stop based on enabled flag
  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [enabled, start, stop]);

  // Pause when tab is hidden — no point polling in background
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else if (enabled) {
        start();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, start, stop]);
}