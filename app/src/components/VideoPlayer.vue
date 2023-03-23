<template>
  <div class="video-wrapper">
    <video
      ref="videoElement"
      controls
      @timeupdate="$emit('timeupdate', $event)"
    >
      <source :src="videoUrl" type="video/mp4" />
    </video>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  props: {
    videoUrl: {
      type: String,
      required: true,
    },
  },

  setup() {
    const videoElement = ref<HTMLVideoElement | null>(null);

    return { videoElement };
  },
});
</script>
