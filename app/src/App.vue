<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { CosmosText, CosmosTitle, CosmosInput } from "@cosmos/web/vue";

import VideoPlayer from "./components/VideoPlayer.vue";
import Transcript from "./components/Transcript.vue";

import type { Ref } from "vue";
import type { AnnotationResult, ParagraphTime, Word } from "@/types/types";

import speechTranscription from "./assets/json-output/SPEECH_TRANSCRIPTION/MI201208130045_h264_720p.json";

const VIDEO_URL =
  "https://storage.googleapis.com/redbull_video_storage/MI201208130045_h264_720p.mp4";

const transcription: AnnotationResult =
  speechTranscription.annotation_results[0];
const currentParagraph = ref(-1);
const currentWordIndex = ref(-1);
const videoElement: Ref<HTMLVideoElement | null> = ref(null);

onMounted(() => {
  videoElement.value = document.querySelector("video");
});

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
      window.scrollTo({
        top: paragraphElement.offsetTop - 16,
        behavior: "smooth",
      });
    }
  }
});
</script>

<template>
  <header class="header">
    <CosmosTitle>VideoGenius</CosmosTitle>
    <CosmosInput class="search"></CosmosInput>
  </header>

  <div class="video-transcript columns">
    <div class="video-wrapper primary">
      <VideoPlayer :videoUrl="VIDEO_URL" @timeupdate="handleTimeUpdate" />

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
</style>
