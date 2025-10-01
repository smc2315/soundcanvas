"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  FileAudio,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { MicrophoneRecorder, AudioProcessor } from "@/lib/audio-context";
import type { AudioMetadata, AudioError } from "@/types";
import { formatDuration, formatFileSize } from "@/utils";

interface AudioInputProps {
  onAudioReady: (audioBlob: Blob, metadata: AudioMetadata) => void;
  onError: (error: AudioError) => void;
  maxDuration?: number;
  acceptedFormats?: string[];
  maxFileSize?: number;
  disabled?: boolean;
  className?: string;
}

type InputState = 'idle' | 'recording' | 'uploading' | 'processing' | 'success' | 'error';

export function AudioInput({
  onAudioReady,
  onError,
  maxDuration = 300, // 5 minutes
  acceptedFormats = ['mp3', 'wav', 'm4a', 'ogg'],
  maxFileSize = 50 * 1024 * 1024, // 50MB
  disabled = false,
  className,
}: AudioInputProps) {
  const [state, setState] = React.useState<InputState>('idle');
  const [recordingDuration, setRecordingDuration] = React.useState(0);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [currentError, setCurrentError] = React.useState<AudioError | null>(null);
  const [microphonePermission, setMicrophonePermission] = React.useState<'unknown' | 'granted' | 'denied'>('unknown');

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const recorderRef = React.useRef<MicrophoneRecorder | null>(null);
  const recordingTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Check microphone permissions on component mount
  React.useEffect(() => {
    checkMicrophonePermission();
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (recorderRef.current) {
        recorderRef.current.cancelRecording();
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setMicrophonePermission(result.state as 'granted' | 'denied');

      result.addEventListener('change', () => {
        setMicrophonePermission(result.state as 'granted' | 'denied');
      });
    } catch (error) {
      // Fallback for browsers that don't support permissions query
      setMicrophonePermission('unknown');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState('uploading');
    setUploadProgress(0);
    setCurrentError(null);

    try {
      // Validate file
      const validationError = AudioProcessor.validateAudioFile(file);
      if (validationError) {
        setCurrentError(validationError);
        setState('error');
        onError(validationError);
        return;
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      setState('processing');
      setUploadProgress(100);

      // Create audio element for playback
      const { audio, metadata } = await AudioProcessor.createAudioElement(file);

      // Convert to blob for consistency with recording
      const audioBlob = new Blob([await file.arrayBuffer()], { type: file.type });

      setState('success');
      onAudioReady(audioBlob, metadata);

    } catch (error) {
      const audioError = error as AudioError;
      setCurrentError(audioError);
      setState('error');
      onError(audioError);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const startRecording = async () => {
    try {
      setState('recording');
      setCurrentError(null);
      setRecordingDuration(0);

      recorderRef.current = new MicrophoneRecorder();
      await recorderRef.current.startRecording();

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);

    } catch (error) {
      const audioError = error as AudioError;
      setCurrentError(audioError);
      setState('error');
      onError(audioError);
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current || !recorderRef.current.isRecording()) return;

    try {
      setState('processing');

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      const { audioBlob, metadata } = await recorderRef.current.stopRecording();

      setState('success');
      onAudioReady(audioBlob, metadata);

    } catch (error) {
      const audioError = error as AudioError;
      setCurrentError(audioError);
      setState('error');
      onError(audioError);
    } finally {
      recorderRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    if (recorderRef.current) {
      recorderRef.current.cancelRecording();
      recorderRef.current = null;
    }

    setState('idle');
    setRecordingDuration(0);
    setCurrentError(null);
  };

  const resetState = () => {
    setState('idle');
    setUploadProgress(0);
    setRecordingDuration(0);
    setCurrentError(null);
  };

  const isRecording = state === 'recording';
  const isProcessing = state === 'processing' || state === 'uploading';
  const isSuccess = state === 'success';
  const isError = state === 'error';

  return (
    <div className={cn("space-y-6", className)}>
      {/* File Upload Section */}
      <Card className={cn(
        "p-6 transition-all duration-300 border-2 border-dashed",
        state === 'uploading' || state === 'processing'
          ? "border-[var(--color-accent-neon-blue)] bg-[var(--color-accent-glow-blue)]"
          : "border-[var(--color-primary-border-default)] hover:border-[var(--color-primary-border-focus)]",
        disabled && "opacity-50 pointer-events-none"
      )}>
        <div className="text-center">
          <div className={cn(
            "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-colors duration-300",
            isProcessing ? "bg-[var(--color-accent-glow-blue)]" : "bg-[var(--color-primary-surface-glass)]"
          )}>
            {state === 'uploading' ? (
              <Loader2 className="w-8 h-8 text-[var(--color-accent-neon-blue)] animate-spin" />
            ) : state === 'processing' ? (
              <Loader2 className="w-8 h-8 text-[var(--color-accent-neon-blue)] animate-spin" />
            ) : isSuccess ? (
              <CheckCircle className="w-8 h-8 text-[var(--color-semantic-success)]" />
            ) : isError ? (
              <AlertCircle className="w-8 h-8 text-[var(--color-semantic-error)]" />
            ) : (
              <Upload className="w-8 h-8 text-[var(--color-primary-text-secondary)]" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-[var(--color-primary-text-primary)] mb-2">
            {isProcessing ? "Processing Audio..." :
             isSuccess ? "Audio Ready!" :
             isError ? "Upload Failed" :
             "Upload Audio File"}
          </h3>

          <p className="text-[var(--color-primary-text-secondary)] mb-4">
            {isProcessing ? "Please wait while we process your audio file." :
             isSuccess ? "Your audio file has been processed successfully." :
             isError ? currentError?.message :
             `Drag and drop your audio file here, or click to browse. Supports ${acceptedFormats.join(', ').toUpperCase()} up to ${formatFileSize(maxFileSize)}.`}
          </p>

          {state === 'uploading' && (
            <div className="mb-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-[var(--color-primary-text-tertiary)] mt-2">
                {uploadProgress}% uploaded
              </p>
            </div>
          )}

          {isError ? (
            <Button
              variant="outline"
              onClick={resetState}
              disabled={disabled}
            >
              Try Again
            </Button>
          ) : isSuccess ? (
            <Button
              variant="outline"
              onClick={resetState}
              disabled={disabled}
            >
              Upload Another File
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isProcessing}
              loading={isProcessing}
            >
              <FileAudio className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.map(format => `.${format}`).join(',')}
            onChange={handleFileUpload}
            className="hidden"
            disabled={disabled}
          />
        </div>
      </Card>

      {/* OR Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--color-primary-border-default)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[var(--color-primary-bg-start)] text-[var(--color-primary-text-tertiary)]">
            OR
          </span>
        </div>
      </div>

      {/* Recording Section */}
      <Card className={cn(
        "p-6 transition-all duration-300",
        isRecording
          ? "border-[var(--color-semantic-error)] bg-[var(--color-semantic-error)]/10"
          : "border-[var(--color-primary-border-default)]",
        disabled && "opacity-50 pointer-events-none"
      )}>
        <div className="text-center">
          <div className={cn(
            "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-300",
            isRecording
              ? "bg-[var(--color-semantic-error)] animate-pulse"
              : microphonePermission === 'denied'
              ? "bg-[var(--color-semantic-error)]/20"
              : "bg-[var(--color-primary-surface-glass)]"
          )}>
            {isRecording ? (
              <Mic className="w-8 h-8 text-white" />
            ) : microphonePermission === 'denied' ? (
              <MicOff className="w-8 h-8 text-[var(--color-semantic-error)]" />
            ) : (
              <Mic className="w-8 h-8 text-[var(--color-primary-text-secondary)]" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-[var(--color-primary-text-primary)] mb-2">
            {isRecording ? "Recording..." :
             microphonePermission === 'denied' ? "Microphone Access Denied" :
             "Record Audio"}
          </h3>

          <p className="text-[var(--color-primary-text-secondary)] mb-4">
            {isRecording ?
              `Recording for ${formatDuration(recordingDuration)} / ${formatDuration(maxDuration)}` :
             microphonePermission === 'denied' ?
              "Please enable microphone access in your browser settings to record audio." :
              `Record up to ${formatDuration(maxDuration)} of audio directly from your microphone.`}
          </p>

          {isRecording && (
            <div className="mb-4">
              <Progress
                value={(recordingDuration / maxDuration) * 100}
                className="h-2"
              />
            </div>
          )}

          {microphonePermission === 'denied' ? (
            <Button
              variant="outline"
              onClick={checkMicrophonePermission}
              disabled={disabled}
            >
              Check Permissions
            </Button>
          ) : isRecording ? (
            <div className="flex gap-3 justify-center">
              <Button
                variant="success"
                onClick={stopRecording}
                disabled={disabled}
              >
                <Square className="w-4 h-4 mr-2" />
                Stop & Save
              </Button>
              <Button
                variant="outline"
                onClick={cancelRecording}
                disabled={disabled}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              onClick={startRecording}
              disabled={disabled || microphonePermission === 'denied'}
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          )}
        </div>
      </Card>

      {/* Error Display */}
      {isError && currentError && (
        <Card className="p-4 border-[var(--color-semantic-error)] bg-[var(--color-semantic-error)]/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--color-semantic-error)] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-[var(--color-semantic-error)] mb-1">
                Error: {currentError.code.replace(/_/g, ' ')}
              </h4>
              <p className="text-sm text-[var(--color-primary-text-secondary)]">
                {currentError.message}
              </p>
              {currentError.details && (
                <p className="text-xs text-[var(--color-primary-text-tertiary)] mt-1">
                  {currentError.details}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}