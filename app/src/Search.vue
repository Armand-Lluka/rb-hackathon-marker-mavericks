<script lang="ts" setup>
import { defineComponent, ref } from "vue";
import { CosmosText, CosmosInput } from "@cosmos/web/vue";

const search = ref("");

</script>

<template>
  <div class="search__container">
    <CosmosInput v-model="search" />
  </div>
</template>

<style>
.search__container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 400px;
  margin: 40px auto;
}
</style>
