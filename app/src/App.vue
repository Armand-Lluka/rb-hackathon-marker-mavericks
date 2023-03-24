<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { CosmosText, CosmosTitle, CosmosInput, CosmosIconPlay } from "@cosmos/web/vue";
import videoJson1 from "../public/MI201208130045_h264_720p - 1679578569.021352.json";

import VideoPlayer from "./components/VideoPlayer.vue";
import Transcript from "./components/Transcript.vue";

import type { Ref } from "vue";
import type {AnnotationResult, ParagraphTime, Segment, TimeOffset, Word} from "@/types/types";

import speechTranscription from "./assets/json-output/SPEECH_TRANSCRIPTION/MI201208130045_h264_720p.json";

const VIDEO_URL =
  "https://storage.googleapis.com/redbull_video_storage/MI201208130045_h264_720p.mp4";

const ANNOTATIONS: any = {
  'MI201208130045_h264': videoJson1,
};

const VIDEO_IDS = [
  "FO-2BDUE7Y9A1113_proxy_normal",
  "FO-2CDBKSCY61114_proxy_normal"
];

const VIDEO_URLS = [
  "https://storage.googleapis.com/redbull_video_storage/MI201208130045_h264_720p.mp4",
];

function getVideoStorageUrl(videoId: string) {
  return `https://storage.googleapis.com/redbull_video_storage/${videoId}.mp4`;
}

interface LabelTimestamp {
  file: string;
  label: string;
  timeStamp: number;
  duration: number;
}

const transcription: AnnotationResult =
    filterTranscript(speechTranscription.annotation_results[0]);
const currentParagraph = ref(-1);
const currentWordIndex = ref(-1);
const videoElement: Ref<HTMLVideoElement | null> = ref(null);
const currentSearchInput = ref("");
const currentSearchResult: Ref<LabelTimestamp[]> = ref([]);
const labelIndex: Record<string, LabelTimestamp[]> = {};

onMounted(() => {
  indexLabels();
  videoElement.value = document.querySelector("video");
});

function filterTranscript(annotationResult: AnnotationResult) {
  return {
    ...annotationResult,
    speech_transcriptions: annotationResult.speech_transcriptions
        .map((transcription) => ({
          ...transcription,
          alternatives: transcription.alternatives.filter((alternative) =>
              alternative.hasOwnProperty("transcript")
          ),
        }))
        .filter((transcription) => transcription.alternatives.length > 0),
  };
}

const paragraphTimes = computed(() => {
  return transcription.speech_transcriptions
    .map((transcription, index) => {
      const words = transcription.alternatives?.flatMap((a) => a.words ?? []);

      if (!words || words.length === 0) {
        return null;
      }

      const startTime = words[0].start_time.seconds;
      const endTime = words[words.length - 1].end_time.seconds;

      return { startTime, endTime, index };
    })
    .filter((time) => time !== null);
});

const paragraphStartTimes = computed(() => {
  return paragraphTimes.value.map((time: ParagraphTime) => {
    if (time) {
      const { startTime } = time;
      const minutes = Math.floor(startTime / 60);
      const seconds = Math.floor(startTime % 60);
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
  });
});

function jumpToTimestamp(time: number) {
  if (videoElement.value) {
    videoElement.value.currentTime = time;
  }
}

function jumpToWord(word: Word) {
  if (videoElement.value) {
    videoElement.value.currentTime =
      (word.start_time.seconds ?? 0) + (word.start_time.nanos ?? 0) / 1e9;
  }
}

function onSearchResultClick(result: LabelTimestamp) {
  jumpToTimestamp(result.timeStamp);
  currentSearchResult.value = [];
  currentSearchInput.value = "";
  videoElement.value?.play();
}

function handleTimeUpdate(event: Event) {
  const currentTime = (event.target as HTMLVideoElement).currentTime;

  currentParagraph.value = paragraphTimes.value.findIndex(
    (time: ParagraphTime) =>
      time && currentTime >= time.startTime && currentTime <= time.endTime
  );

  if (currentParagraph.value !== -1) {
    const words: Word[] =
      transcription.speech_transcriptions[currentParagraph.value]
        .alternatives[0]?.words ?? [];

    currentWordIndex.value = words.findIndex((word: Word) => {
      const wordStartTime =
        (word.start_time.seconds ?? 0) + (word.start_time.nanos ?? 0) / 1e9;
      const wordEndTime =
        (word.end_time.seconds ?? 0) + (word.end_time.nanos ?? 0) / 1e9;

      return currentTime >= wordStartTime && currentTime <= wordEndTime;
    });
  } else {
    currentWordIndex.value = -1;
  }
}

watch(currentParagraph, (newValue) => {
  if (newValue !== -1) {
    const paragraphElement = document.querySelector(
        `.paragraph[data-index="${newValue}"]`
    ) as HTMLElement;

    if (paragraphElement) {
      const containerElement = paragraphElement.parentElement as HTMLElement;
      const containerRect = containerElement.getBoundingClientRect();
      const elementRect = paragraphElement.getBoundingClientRect();

      // Calculate the scroll position so that the paragraph element is at the top of the container, offset by 8px
      const scrollPosition = elementRect.top - containerRect.top + containerElement.scrollTop - 8;

      containerElement.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      });
    }
  }
});

watch(currentSearchInput, (newValue) => {
  if (newValue.length > 0) {
    currentSearchResult.value = searchTimestampsForLabel(newValue);
  } else {
    currentSearchResult.value = [];
  }
  console.log(currentSearchResult.value);
});

function onSearchChanged(newValue: CustomEvent<{value: string}>)  {
  console.log(newValue);
  if (newValue.detail.value.length > 0) {
    currentSearchResult.value = searchTimestampsForLabel(newValue.detail.value);
  } else {
    currentSearchResult.value = [];
  }
}

function indexLabels() {
  Object.values(ANNOTATIONS).forEach((va: any) => {
      va.annotation_results.forEach((r: any) => {
        if (r.shot_label_annotations) {
          const fileName = r.input_uri;

          for (const shotLabel of r.shot_label_annotations) {
            const segments: { segment: Segment }[] = shotLabel.segments;
            const longEnoughSegments = segments.filter(s => calculateSegmentDuration(s.segment) >= 1);
            longEnoughSegments.forEach(s => {
              if (!labelIndex[shotLabel.entity.description]) {
                labelIndex[shotLabel.entity.description] = [];
              }
              labelIndex[shotLabel.entity.description].push({
                file: fileName,
                label: shotLabel.entity.description,
                timeStamp: convertTimestampToNumber(s.segment.start_time_offset),
                duration: calculateSegmentDuration(s.segment)
              })
            });
          }
        }
      });
  });
}

function searchTimestampsForLabel(searchText: string): LabelTimestamp[] {
  return Object.entries(labelIndex).filter(([key]) => key.includes(searchText)).flatMap(([key, info]) => info);
}

function convertTimestampToNumber(timestamp: TimeOffset): number {
  return (timestamp.seconds ?? 0) + (timestamp.nanos ?? 0) / 1000000000;
}

function calculateSegmentDuration(segment: Segment): number {
  return convertTimestampToNumber(segment.end_time_offset) - convertTimestampToNumber(segment.start_time_offset);
}
</script>

<template>
  <header class="header">
    <CosmosTitle><CosmosIconPlay/>VideoGenius</CosmosTitle>
    <CosmosInput class="search" label="Search" placeholder="Search for keywords or objects in the video" @inputinput="onSearchChanged" clearable></CosmosInput>
    <div class="search-results" v-if="currentSearchResult.length > 0">
      <CosmosText v-for="(result, index) in currentSearchResult" :key="index"
                  size="small@medium medium@small"
                  class="search-result"
                  @click="onSearchResultClick(result)"
      >
        {{ result.label + " (" + result.timeStamp + ")"  }}
      </CosmosText>
    </div>
  </header>



  <div v-for="video of VIDEO_URLS" class="video-transcript columns">
    <div class="video-wrapper primary">
      <VideoPlayer :videoUrl="video" @timeupdate="handleTimeUpdate" />
    </div>
    <div class="transcript secondary">
      <Transcript class="secondary-inner" :transcription="transcription" :currentParagraph="currentParagraph">
        <template #timestamp="{ paragraphIndex }">
          <CosmosText @click="jumpToTimestamp(paragraphTimes[paragraphIndex].startTime)" size="x-small" class="timestamp">
            {{ paragraphStartTimes[paragraphIndex] }}
          </CosmosText>
        </template>
        <template #words="{ alternative, paragraphIndex }">
          <CosmosText v-if="paragraphStartTimes[paragraphIndex]" v-for="(word, index) in alternative.words" :key="index"
            :kind="currentParagraph === paragraphIndex ? 'normal' : 'subtle'" size="small@medium medium@small"
            class="word">
            <span :class="{
              currentWord:
                currentParagraph === paragraphIndex &&
                currentWordIndex === index,
            }" @click="jumpToWord(word)">
              {{ word.word }}
            </span>
            <span>&nbsp;</span>
          </CosmosText>
        </template>
      </Transcript>
    </div>

  </div>
</template>

<style>
.search {
  width: 100%
}

.columns {
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  justify-content: center;
  min-width: calc(360px / (16 / 9));
  max-width: 1000px;
}

.primary {
  max-width: 75%;
  min-width: 600px;
  margin-left: 24px;
  padding-top: 24px;
  padding-right: 24px;
  min-height: 400px;
}

.secondary {
  position: relative;
  max-width: 50%;
  min-width: 400px;
  padding-top: 24px;
  padding-right: 24px;
}

.secondary-inner {
  max-height: 340px;
  margin-bottom: 24px;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  box-sizing: border-box;
  padding: 0.5rem;
}

.currentParagraph {
  background: #f8f8f8;
}

.currentWord {
  outline: 2px solid #0a86cb;
  outline-offset: 2px;
  border-radius: 5px;
}

.timestamp {
  width: 100%;
  margin-bottom: 0.25rem;
  --cosmos-text-color: #0a86cb;
}

.header {
  position: relative;
}

.search-results {
  background: white;
  border-radius: 4px;
  border: 1px solid rgba(0, 15, 30, 0.4);
  left: 50%;
  margin-top: 0.5rem;
  max-width: calc(500px - 2rem);
  padding: 1rem;
  position: absolute;
  top: 100%;
  transform: translateX(-250px);
  width: 100%;
  z-index: 10;
}

.search-result {
  cursor: pointer;
  padding: 0.5rem 1rem;
}

.search-result:hover {
  --cosmos-text-color: rgba(0, 15, 30, 0.6);
}

</style>
