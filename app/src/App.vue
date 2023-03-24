<script setup>
import { ref, computed } from "vue";
import { CosmosText, CosmosInput } from "@cosmos/web/vue";
import speechTranscription from "./assets/json-output/SPEECH_TRANSCRIPTION/MI201208130045_h264_720p.json";

const VIDEO_URL =
  "https://storage.googleapis.com/redbull_video_storage/MI201208130045_h264_720p.mp4";
const transcription = speechTranscription.annotation_results[0];
const currentParagraph = ref(-1);
const currentWordIndex = ref(-1);

const paragraphTimes = computed(() => {
  return transcription.speech_transcriptions
    .map((transcription, index) => {
      const words = transcription.alternatives?.[0]?.words;

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
  return paragraphTimes.value.map(({ startTime }) => {
    const minutes = Math.floor(startTime / 60);
    const seconds = Math.floor(startTime % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  });
});

function jumpToTimestamp(time) {
  const video = document.querySelector("video");
  video.currentTime = time;
}

function jumpToWord(word) {
  const video = document.querySelector("video");
  video.currentTime = word.start_time.seconds + word.start_time.nanos / 1e9;
}

function handleTimeUpdate(event) {
  const currentTime = event.target.currentTime;
  const foundTime = paragraphTimes.value.find(
    (time) => currentTime > time.startTime && currentTime <= time.endTime
  );

  currentParagraph.value = foundTime?.index ?? -1;

  if (currentParagraph.value !== -1) {
    const words =
      transcription.speech_transcriptions[currentParagraph.value]
        .alternatives[0].words;

    for (let i = 0; i < words.length; i++) {
      const wordStartTime =
        words[i].start_time.seconds + words[i].start_time.nanos / 1e9;
      const wordEndTime =
        words[i].end_time.seconds + words[i].end_time.nanos / 1e9;

      if (currentTime >= wordStartTime && currentTime <= wordEndTime) {
        currentWordIndex.value = i;
        break;
      }
    }
  } else {
    currentWordIndex.value = -1;
  }
}
</script>

<template>
  <div class="video-transcript columns">

    <div class="video-wrapper primary">
      <video controls @timeupdate="handleTimeUpdate">
        <source :src="VIDEO_URL" type="video/mp4" />
      </video>
    </div>
    <div class="transcript secondary">
      <div class="secondary-inner">
        <div v-for="(t, paragraphIndex) of transcription.speech_transcriptions" :key="paragraphIndex"
          :class="{ currentParagraph: currentParagraph === paragraphIndex }" class="paragraph">
          <CosmosText v-if="paragraphStartTimes[paragraphIndex]"
            @click="jumpToTimestamp(paragraphTimes[paragraphIndex].startTime)" weight="bold" size="x-small"
            class="timestamp">
            {{ paragraphStartTimes[paragraphIndex] }}
          </CosmosText>
          <div v-for="alternative of t.alternatives">
            <CosmosText v-for="(word, index) of alternative.words" size="x-small" :key="index" class="word">
              <span>&nbsp;</span>
              <span :class="{
                currentWord:
                  currentParagraph === paragraphIndex &&
                  currentWordIndex === index,
              }" @click="jumpToWord(word)">{{ word.word }}</span>
            </CosmosText>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
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
