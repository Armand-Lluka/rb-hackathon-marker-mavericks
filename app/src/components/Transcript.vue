<template>
  <div class="transcript">
    <div
      v-for="(t, paragraphIndex) in transcription.speech_transcriptions"
      :key="paragraphIndex"
      :class="{ currentParagraph: currentParagraph === paragraphIndex }"
      class="paragraph"
      :data-index="paragraphIndex"
    >
      <slot name="timestamp" :paragraphIndex="paragraphIndex"></slot>
      <template v-for="alternative in t.alternatives">
        <slot
          name="words"
          :alternative="alternative"
          :paragraphIndex="paragraphIndex"
        ></slot>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { AnnotationResult } from "@/types/types";

export default defineComponent({
  props: {
    transcription: {
      type: Object as () => AnnotationResult,
      required: true,
    },
    currentParagraph: {
      type: Number,
      required: true,
    },
  },
});
</script>
