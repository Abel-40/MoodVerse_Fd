"use client";

/**
 * Records a clip from the microphone so the voice endpoint can be tested
 * without hunting for an audio file.
 *
 * Browsers produce audio/webm here, which is on the API's accepted list. The
 * MediaRecorder mime type often carries a codecs parameter ("audio/webm;
 * codecs=opus") that would fail the server's exact-match check, so the File is
 * rebuilt with the bare type.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const ACCEPTED = ["audio/webm", "audio/ogg", "audio/mp4"];

export function VoiceRecorder({ onRecorded }: { onRecorded: (file: File) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; size: number } | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const supported = ACCEPTED.find(
        (type) =>
          typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type),
      );
      const recorder = new MediaRecorder(
        stream,
        supported ? { mimeType: supported } : undefined,
      );

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        // Strip any ";codecs=..." suffix - the API matches the type exactly.
        const type = (recorder.mimeType || "audio/webm").split(";")[0];
        const blob = new Blob(chunksRef.current, { type });
        const extension = type.split("/")[1] ?? "webm";
        const file = new File([blob], `reflection.${extension}`, { type });

        setPreview((current) => {
          if (current) URL.revokeObjectURL(current.url);
          return { url: URL.createObjectURL(blob), size: blob.size };
        });
        onRecorded(file);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? `${cause.message} - microphone access is only granted on localhost or HTTPS.`
          : String(cause),
      );
    }
  }, [onRecorded]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }, []);

  return (
    <div className="rounded-md border border-ink-800 bg-ink-900/50 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={recording ? stop : start}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            recording
              ? "bg-bad/20 text-bad hover:bg-bad/30"
              : "bg-ink-700 text-ink-100 hover:bg-ink-600"
          }`}
        >
          {recording ? `■ stop (${seconds}s)` : "● record from microphone"}
        </button>

        {recording && (
          <span className="flex items-center gap-2 text-xs text-bad">
            <span className="h-2 w-2 animate-pulse rounded-full bg-bad" />
            recording
          </span>
        )}

        {preview && !recording && (
          <>
            <audio controls src={preview.url} className="h-8" />
            <span className="text-xs text-ink-500">{preview.size} B, attached</span>
          </>
        )}
      </div>

      {error && <p className="mt-2 font-mono text-xs text-bad">{error}</p>}
    </div>
  );
}
