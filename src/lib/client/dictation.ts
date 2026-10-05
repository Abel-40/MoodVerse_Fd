"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// The Web Speech API is not in TypeScript's DOM types yet; describe the part we use.
interface RecognitionResultList {
  length: number;
  [index: number]: { isFinal: boolean; 0: { transcript: string } };
}
interface Recognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  processLocally?: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { resultIndex: number; results: RecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noSubscription = () => () => {};

/** Voice ships behind NEXT_PUBLIC_VOICE=1 until the privacy review is done. */
export const VOICE_ENABLED = process.env.NEXT_PUBLIC_VOICE === "1";

export interface Dictation {
  supported: boolean;
  listening: boolean;
  /** Words the recogniser has settled on. */
  finalText: string;
  /** Words it may still change; shown lighter. */
  interimText: string;
  elapsedSeconds: number;
  start: () => void;
  /** Stop and return everything heard. */
  finish: () => string;
}

/**
 * Speech to text in the browser. Nothing is recorded or uploaded by MoodVerse;
 * where the browser supports it, recognition is asked to run on the device.
 */
export function useDictation(): Dictation {
  const supported = useSyncExternalStore(noSubscription, () => recognitionConstructor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [elapsedSeconds, setElapsed] = useState(0);
  const recognition = useRef<Recognition | null>(null);
  const finalRef = useRef("");

  useEffect(() => {
    if (!listening) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [listening]);

  useEffect(() => () => recognition.current?.abort(), []);

  const start = useCallback(() => {
    const Constructor = recognitionConstructor();
    if (!Constructor || recognition.current) return;
    const r = new Constructor();
    r.lang = navigator.language;
    r.continuous = true;
    r.interimResults = true;
    if ("processLocally" in r) r.processLocally = true;
    r.onresult = (event) => {
      let settled = "";
      let pending = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) settled += result[0].transcript;
        else pending += result[0].transcript;
      }
      finalRef.current = settled.trim();
      setFinalText(finalRef.current);
      setInterimText(pending.trim());
    };
    r.onerror = () => r.stop();
    r.onend = () => {
      recognition.current = null;
      setListening(false);
    };
    recognition.current = r;
    finalRef.current = "";
    setFinalText("");
    setInterimText("");
    setElapsed(0);
    setListening(true);
    r.start();
  }, []);

  const finish = useCallback(() => {
    recognition.current?.stop();
    const heard = finalRef.current;
    setInterimText("");
    return heard;
  }, []);

  return { supported, listening, finalText, interimText, elapsedSeconds, start, finish };
}
