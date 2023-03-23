export interface AnnotationResult {
  input_uri: string;
  segment: Segment;
  speech_transcriptions: SpeechTranscription[];
}

export interface Segment {
  start_time_offset: StartTimeOffset;
  end_time_offset: EndTimeOffset;
}

export interface StartTimeOffset {}

export interface EndTimeOffset {
  seconds: number;
  nanos: number;
}

export interface SpeechTranscription {
  alternatives: Alternative[];
  language_code: string;
}

export interface Alternative {
  transcript?: string;
  confidence?: number;
  words?: Word[];
}

export interface Word {
  start_time: StartTime;
  end_time: EndTime;
  word: string;
}

export interface StartTime {
  seconds: number;
  nanos?: number;
}

export interface EndTime {
  seconds: number;
  nanos?: number;
}

export type ParagraphTime = {
  startTime: number;
  endTime: number;
  index: number;
} | null;
