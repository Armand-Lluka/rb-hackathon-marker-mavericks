<script setup>
import speechTranscription from "./assets/json-output/SPEECH_TRANSCRIPTION/MI201208130045_h264_720p.json";
import { defineComponent } from "vue";
import { CosmosText } from "@cosmos/web/vue";

const VIDEO_URL =
  "https://storage.googleapis.com/redbull_video_storage/MI201208130045_h264_720p.mp4";

defineComponent({
  components: { CosmosText },
});

const transcription = speechTranscription.annotation_results[0];

function jumpToWord(word) {
  const video = document.querySelector("video");
  video.currentTime =
    word.start_time.seconds + word.start_time.nanos / 1000000000;
}
</script>

<template>
  <div class="wrapper">
    <video controls>
      <source :src="VIDEO_URL" type="video/mp4" />
    </video>
    <div class="transcript">
      <div
        v-for="transcription of transcription.speech_transcriptions"
        class="paragraph"
      >
        <template v-for="alternative of transcription.alternatives">
          <CosmosText
            v-for="(word, index) of alternative.words"
            :key="index"
            @click="jumpToWord(word)"
            >&nbsp;{{ word.word }}
          </CosmosText>
        </template>
      </div>
    </div>
  </div>
</template>
