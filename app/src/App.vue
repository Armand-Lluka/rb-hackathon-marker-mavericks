<script setup>
import speechTranscription from './assets/json-output/SPEECH_TRANSCRIPTION/MI201208130045_h264_720p.json';

const transcription = speechTranscription.annotation_results[0];
console.log(transcription)
</script>

<template>
  <div class="wrapper">
    <video controls>
      <source src="/assets/videos/MI201208130045_h264_720p.mp4" type="video/mp4">
    </video>
    <p v-for="alternative of transcription.speech_transcriptions">{{alternative.alternatives[0].transcript}}</p>
  </div>
</template>
