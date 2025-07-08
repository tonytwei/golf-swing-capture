"use client";
import React, { useEffect, useRef, useState } from "react";
// google-chrome --use-fake-device-for-media-stream --use-file-for-fake-video-capture=d:\Windows Default Folders\Desktop\videoplayback.mjpeg

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [status, setStatus] = useState("Idle");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);

  // Always show camera preview in the background
  useEffect(() => {
    let isMounted = true;
    const getCamera = async () => {
      try {
        // Stop previous stream if switching
        cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        cameraStreamRef.current = stream;
        if (cameraVideoRef.current && isMounted) {
          cameraVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        setStatus("Camera not available");
      }
    };
    getCamera();
    return () => {
      isMounted = false;
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode]);

  const startRecording = async () => {
    setStatus("Recording...");
    setVideoURL(null);
    setRecording(true);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: true,
    });
    streamRef.current = stream;

    const chunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      setVideoURL(URL.createObjectURL(blob));
      setStatus("Stopped");
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    setStatus("Stopping...");
    mediaRecorderRef.current?.stop();
  };

  const reset = () => {
    setVideoURL(null);
    setStatus("Idle");
    setRecording(false);
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen gap-8 p-8">
      {/* Camera preview as background */}
      <video
        ref={cameraVideoRef}
        autoPlay
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover -z-10"
        style={{ filter: "brightness(0.7)" }}
      />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <h1 className="text-2xl font-bold mb-4 text-white drop-shadow">Record Your Swing</h1>
        <p className="text-white drop-shadow">
          Status: <span className="font-mono">{status}</span>
        </p>
        <button
          className="bg-yellow-600 text-white px-4 py-2 rounded font-bold"
          onClick={switchCamera}
          style={{ marginBottom: 8 }}
        >
          Switch Camera
        </button>
        {!recording && !videoURL && (
          <button
            className="bg-green-600 text-white px-6 py-2 rounded font-bold"
            onClick={startRecording}
          >
            Play (Start Recording)
          </button>
        )}
        {recording && (
          <button
            className="bg-red-600 text-white px-6 py-2 rounded font-bold"
            onClick={stopRecording}
          >
            Stop
          </button>
        )}
        {videoURL && (
          <div className="flex flex-col items-center gap-4">
            <video src={videoURL} controls width={320} />
            <div className="flex gap-4">
              <a
                href={videoURL}
                download="recording.webm"
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save Video
              </a>
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded"
                onClick={reset}
              >
                Restart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );