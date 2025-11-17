<template>
  <q-page class="">
    <div class="q-pt-xl">
      <TimerList class="q-mx-auto" :timer-list="timerStore.timers"></TimerList>
    </div>
  </q-page>
</template>

<script setup lang="ts">
// import { ref } from 'vue';
import { useTimerStore } from 'src/stores/timer-store';
import TimerList from 'src/components/TimerList.vue';

const timerStore = useTimerStore();
</script>
