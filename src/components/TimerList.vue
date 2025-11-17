<template>
  <div class="q-pa-md" style="max-width: 400px">
    <q-toolbar class="bg-purple-5 text-white shadow-2">
      <q-toolbar-title>File d'attente</q-toolbar-title>
      <q-space></q-space>
      <div class="">
        <q-btn
          @click="openCreateOrEditTimerModal()"
          round
          color="primary"
          size="16px"
          icon="add"
          class="col"
        >
          <q-tooltip class="bg-dark" :offset="[10, 10]"> ajouter </q-tooltip>
        </q-btn>
        <!-- <q-btn
          @click="openCreateOrEditTimerModal()"
          flat
          round
          color="amber"
          size="16px"
          icon="play_circle"
          class="col"
        >
          <q-tooltip class="bg-dark" :offset="[10, 10]"> Lancer </q-tooltip>
        </q-btn> -->
      </div>
    </q-toolbar>

    <q-list bordered>
      <q-item v-for="(timer, i) in props.timerList" :key="timer.title" class="q-my-sm">
        <q-item-section avatar>
          <q-avatar color="white" text-color="dark">
            {{ i + 1 }}
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label
            >{{ timer.title }}
            <q-badge v-if="timer.autoStop" align="top" color="red"
              >Time's up activé</q-badge
            ></q-item-label
          >
          <q-item-label caption lines="1">{{ timer.time }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <div class="row items-start">
            <q-btn
              @click="openCreateOrEditTimerModal(timer, i)"
              flat
              round
              color="primary"
              size="16px"
              icon="edit"
              class="col"
            >
              <q-tooltip class="bg-dark" :offset="[10, 10]"> modifier </q-tooltip>
            </q-btn>
            <q-btn
              v-if="i !== 0"
              @click="openDeleteTimerModal(i)"
              flat
              round
              color="negative"
              size="16px"
              icon="delete"
              class="col"
            >
              <q-tooltip class="bg-dark" :offset="[10, 10]"> supprimer </q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>

      <q-item v-if="!props.timerList.length" class="q-my-sm">
        <q-item-section>
          <div class="text-center">Aucun timer</div>
        </q-item-section>
      </q-item>
    </q-list>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        @click="openRunningTimerModal()"
        round
        color="amber"
        size="32px"
        glossy
        push
        icon="play_circle"
        class="col"
      >
        <q-tooltip class="bg-dark" :offset="[10, 10]"> Lancer </q-tooltip>
      </q-btn>
    </q-page-sticky>

    <q-dialog v-model="isCreateOrEditTimerModal" persistent>
      <q-card>
        <q-card-section class="" style="min-width: 400px">
          <h4 class="text-center">{{ editTimer ? 'Modifier un timer' : 'Ajouter un timer' }}</h4>
          <q-form class="q-gutter-md">
            <q-input
              filled
              color="accent"
              v-model="title"
              label="Titre du timer *"
              lazy-rules
              :rules="[(val) => (val && val.length > 0) || 'Please type something']"
            />

            <q-input
              filled
              color="accent"
              hint="hh:mm:ss"
              v-model="time"
              mask="fulltime"
              :rules="['fulltime']"
            >
              <template v-slot:append>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="time" with-seconds format24h>
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-time>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <q-toggle v-model="autoStop" label="Afficher 'TIME\'S UP' après la fin du temps ?" />
            <q-toggle v-model="isProgressBar" label="Activer la bar de progression ?" />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn @click="onReset()" flat label="Annuler" color="grey" v-close-popup />
          <q-btn
            @click="submitTimer()"
            :disable="!isValidForm"
            flat
            :label="editTimer ? 'Enregistrer' : 'Modifier'"
            color="primary"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="isDeleteTimerModal" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="amber" text-color="white" />
          <span class="q-ml-sm">Voulez-vous supprimer ce timer ?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Annuler" color="primary" v-close-popup />
          <q-btn @click="deleteTimer()" flat label="Supprimer" color="negative" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="isRunningTimerModal"
      persistent
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="text-white" :class="timerStore.autoStopTriggered ? 'bg-red' : 'bg-dark'">
        <q-bar>
          <q-space />

          <q-btn disable dense flat icon="double_arrow">
            <q-tooltip class="bg-white text-primary">suivant</q-tooltip>
          </q-btn>
          <q-btn
            v-if="timerStore.intervalId"
            dense
            flat
            icon="stop_circle"
            @click="timerStore.stopTimer()"
          >
            <q-tooltip class="bg-white text-primary">stop</q-tooltip>
          </q-btn>
          <q-btn v-else dense flat icon="play_circle" @click="timerStore.startTimer()">
            <q-tooltip class="bg-white text-primary">start</q-tooltip>
          </q-btn>
          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section>
          <div v-if="!timerStore.autoStopTriggered" class="runningTimer text-center">
            <p class="runningTimer__title">{{ timerStore.currentTimer?.title }}</p>
            <p class="runningTimer__time">{{ timerStore.currentTimer?.time }}</p>
            <q-linear-progress
              v-if="timerStore.currentTimer?.isProgressBar"
              reverse
              stripe
              rounded
              size="30px"
              :value="progress"
              :color="progressColor"
              class="q-mt-sm"
            >
            </q-linear-progress>
          </div>
          <div v-else class="stopTimer">
            <p class="stopTimer__message">TIME'S UP</p>
            <q-btn
              @click="continueTimer()"
              rounded
              color="primary"
              size="36px"
              icon-right="double_arrow"
              label="Prochain Timer"
            ></q-btn>
          </div>

          <div v-if="!timerStore.currentTimer" class="text-h2 text-weight-bold text-center q-mt-lg">
            Aucun Timer
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Timer } from './models';
import { useTimerStore } from 'src/stores/timer-store';
import { useQuasar } from 'quasar';

const props = defineProps<{
  timerList: Timer[];
}>();

const $q = useQuasar();
const timerStore = useTimerStore();
const editTimer = ref<Timer | null>(null);
const editOrDeleteTimerId = ref<number | null>(null);

const title = ref('');
const time = ref('00:00:15');
const autoStop = ref(false);
const isProgressBar = ref(true);

const isCreateOrEditTimerModal = ref(false);
const isDeleteTimerModal = ref(false);
const isRunningTimerModal = ref(false);

const isValidForm = computed(() => {
  return title.value && title.value.length > 2 && time.value;
});

// ⏳ total en secondes pour le current timer
const totalSeconds = computed(() => {
  return timerStore.totalSeconds;
});

// ⏱️ seconds elapsed
const elapsedSeconds = computed(() => timerStore.elapsedTime);

// % progression
const progress = computed(() => {
  if (totalSeconds.value === 0) return 0;
  return 1 - elapsedSeconds.value / totalSeconds.value;
});

// 🎨 Couleurs dynamiques
const progressColor = computed(() => {
  const pct = progress.value * 100;
  if (pct > 50) return 'green';
  if (pct > 25) return 'orange';
  return 'red';
});

function openCreateOrEditTimerModal(timer?: Timer, timerId?: number) {
  if (timer) {
    editTimer.value = timer;
    editOrDeleteTimerId.value = timerId as number;
    title.value = editTimer.value.title;
    time.value = editTimer.value.time;
    autoStop.value = editTimer.value.autoStop;
    isProgressBar.value = editTimer.value.isProgressBar;

    isCreateOrEditTimerModal.value = true;
    return;
  }
  isCreateOrEditTimerModal.value = true;
}

function openDeleteTimerModal(timerId?: number) {
  editOrDeleteTimerId.value = timerId as number;

  isDeleteTimerModal.value = true;
}

function openRunningTimerModal() {
  isRunningTimerModal.value = true;
  timerStore.startTimer();
}

function submitTimer() {
  const newTimer = {
    title: title.value,
    time: time.value,
    autoStop: autoStop.value,
    isProgressBar: isProgressBar.value,
  };

  if (editTimer.value && (editOrDeleteTimerId.value || editOrDeleteTimerId.value === 0)) {
    timerStore.editTimer(editOrDeleteTimerId.value, newTimer);
    isCreateOrEditTimerModal.value = false;
    onReset();
    $q.notify({
      type: 'positive',
      message: 'Le timer a été modifié !',
    });
    return;
  }
  if (timerStore.isLimit) {
    $q.notify({
      type: 'negative',
      message: 'Vous ne pouvez pas créer plus de 10 timers',
    });
    return;
  }
  timerStore.addTimer(newTimer);
  isCreateOrEditTimerModal.value = false;
  onReset();
  $q.notify({
    type: 'positive',
    message: 'Le timer a été créé !',
  });
}

function deleteTimer() {
  timerStore.deleteTimer(editOrDeleteTimerId.value as number);
  isDeleteTimerModal.value = false;
  $q.notify({
    type: 'positive',
    message: 'Le timer a été supprimé !',
  });
}

function onReset() {
  title.value = '';
  time.value = '00:00:15';
  autoStop.value = false;
  isProgressBar.value = true;
  editTimer.value = null;
  editOrDeleteTimerId.value = null;
}

function continueTimer() {
  timerStore.continueAfterAutoStop();
}
</script>

<style lang="scss" scoped>
.runningTimer {
  &__title {
    font-size: 130px;
    font-weight: bold;
    text-transform: uppercase;
  }
  &__time {
    font-size: 250px;
    font-weight: bolder;
    color: $amber-12;
  }
}
.stopTimer {
  display: flex;
  justify-items: center;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin-top: 100px;
  &__message {
    font-size: 250px;
    font-weight: bolder;
    text-transform: uppercase;
    color: white;
    animation: tilt-shaking 0.3s infinite;
  }
}

@keyframes tilt-shaking {
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(5deg);
  }
  50% {
    transform: rotate(0eg);
  }
  75% {
    transform: rotate(-5deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
</style>
