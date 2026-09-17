import { useEffect, useRef, useState } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { VoiceSessionGate } from "./VoiceSessionGate";

export type SpeechStatus =
  | "ready"
  | "requestingPermission"
  | "starting"
  | "listening"
  | "stopping"
  | "cancelling"
  | "heard"
  | "permissionDenied"
  | "unavailable"
  | "noMatch"
  | "error";

type Options = {
  onHeard: (statement: string) => void;
  onRecoveryText: (statement: string) => void;
};

const firstTranscript = (results: Array<{ transcript: string }>) =>
  results.map((result) => result.transcript).filter(Boolean).join(" ").trim();

export function useTendSpeech({ onHeard, onRecoveryText }: Options) {
  const [status, setStatus] = useState<SpeechStatus>("ready");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [detail, setDetail] = useState("Ready. Nothing is submitted or saved.");
  const [volume, setVolume] = useState(-2);
  const gate = useRef(new VoiceSessionGate());
  const partialRef = useRef("");
  const finalRef = useRef("");
  const cancelledRef = useRef(false);
  const failedRef = useRef(false);
  const onHeardRef = useRef(onHeard);
  const onRecoveryRef = useRef(onRecoveryText);

  useEffect(() => { onHeardRef.current = onHeard; }, [onHeard]);
  useEffect(() => { onRecoveryRef.current = onRecoveryText; }, [onRecoveryText]);

  useEffect(() => {
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      setStatus("unavailable");
      setDetail("Voice input isn't available on this device. You can type instead.");
    }
  }, []);

  useSpeechRecognitionEvent("start", () => {
    if (!gate.current.isActive()) return;
    setStatus("listening");
    setDetail("Listening. Nothing will be saved without your confirmation.");
  });

  useSpeechRecognitionEvent("result", (event) => {
    if (!gate.current.isActive() || cancelledRef.current || failedRef.current) return;
    const transcript = firstTranscript(event.results);
    if (event.isFinal) {
      finalRef.current = transcript;
      partialRef.current = "";
      setFinalTranscript(transcript);
      setPartialTranscript("");
      setDetail("Heard. Waiting for recognition to finish.");
    } else {
      partialRef.current = transcript;
      setPartialTranscript(transcript);
    }
  });

  useSpeechRecognitionEvent("volumechange", (event) => {
    if (gate.current.isActive()) setVolume(event.value);
  });

  useSpeechRecognitionEvent("nomatch", () => {
    if (!gate.current.isActive()) return;
    failedRef.current = true;
    setStatus("noMatch");
    setDetail("Tend couldn't hear recognizable words. Your activity was not submitted.");
  });

  useSpeechRecognitionEvent("error", (event) => {
    if (!gate.current.isActive()) return;
    if (event.error === "aborted" && cancelledRef.current) return;
    failedRef.current = true;
    setStatus(event.error === "not-allowed" ? "permissionDenied" : "error");
    setDetail(
      event.error === "not-allowed"
        ? "Microphone permission is needed to speak. You can type instead."
        : "Tend couldn't transcribe that. Your activity was not submitted.",
    );
  });

  useSpeechRecognitionEvent("end", () => {
    if (!gate.current.isActive()) return;
    const recovery = finalRef.current || partialRef.current;
    const shouldSubmit = !cancelledRef.current && !failedRef.current && recovery.length > 0;
    gate.current.end();
    setVolume(-2);
    if (shouldSubmit) {
      setStatus("heard");
      setDetail("Heard. Review the interpretation before Tend saves anything.");
      onHeardRef.current(recovery);
    } else {
      if (recovery) onRecoveryRef.current(recovery);
      if (cancelledRef.current) {
        setStatus("ready");
        setDetail("Voice input was cancelled. Nothing was submitted or saved.");
      }
    }
  });

  const start = async () => {
    if (gate.current.isActive()) return;
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      setStatus("unavailable");
      setDetail("Voice input isn't available on this device. You can type instead.");
      return;
    }
    setStatus("requestingPermission");
    setDetail("Checking microphone permission.");
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setStatus("permissionDenied");
        setDetail("Microphone permission is needed to speak. You can type instead.");
        return;
      }
      if (gate.current.begin() === null) return;
      cancelledRef.current = false;
      failedRef.current = false;
      partialRef.current = "";
      finalRef.current = "";
      setPartialTranscript("");
      setFinalTranscript("");
      setVolume(-2);
      setStatus("starting");
      setDetail("Starting voice input.");
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
      });
    } catch {
      gate.current.end();
      setStatus("error");
      setDetail("Tend couldn't start voice input. You can type instead.");
    }
  };

  const done = () => {
    if (!gate.current.isActive()) return;
    setStatus("stopping");
    setDetail("Finishing voice input.");
    ExpoSpeechRecognitionModule.stop();
  };

  const cancel = () => {
    if (!gate.current.isActive()) return;
    cancelledRef.current = true;
    setStatus("cancelling");
    setDetail("Cancelling voice input.");
    ExpoSpeechRecognitionModule.abort();
  };

  const reset = () => {
    if (gate.current.isActive()) return;
    setStatus("ready");
    setPartialTranscript("");
    setFinalTranscript("");
    partialRef.current = "";
    finalRef.current = "";
    setDetail("Ready. Nothing is submitted or saved.");
  };

  return {
    status,
    partialTranscript,
    finalTranscript,
    detail,
    volume,
    isBusy: gate.current.isActive(),
    start,
    done,
    cancel,
    reset,
  };
}
