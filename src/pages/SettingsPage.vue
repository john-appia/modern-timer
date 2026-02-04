<template>
  <q-page class="q-px-xl">
    <h4>Paramètres</h4>
    <q-card class="q-mx-auto" style="max-width: 650px">
      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="accent"
        indicator-color="accent"
        align="justify"
        narrow-indicator
      >
        <q-tab name="programme" label="Programme" />
        <q-tab name="denombrement" label="Dénombrement" disable />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="programme">
          <q-btn
            class="q-mb-lg"
            color="primary"
            icon="add"
            label="Ajouter un programme"
            @click="onOpenProgramDialog()"
          />
          <q-list bordered class="rounded-borders" v-if="programStore.programs.length">
            <q-expansion-item
              v-for="(item, i) in programStore.programs"
              :key="item.title"
              :label="item.title"
              expand-separator
              group="somegroup"
            >
              <q-card>
                <q-card-section>
                  <div class="q-mb-sm">
                    <q-btn
                      outline
                      class="q-pa-xs q-mr-sm"
                      color="primary"
                      label="ajouter à la file d'attente"
                      @click="addProgramTimersToQueue(item.id as number)"
                    />
                    <q-btn
                      square
                      class="q-mr-sm"
                      icon="edit"
                      color="info"
                      @click="onOpenProgramDialog(item, i)"
                      ><q-tooltip class="bg-white text-primary"
                        >Modifier le programme</q-tooltip
                      ></q-btn
                    >
                    <q-btn
                      square
                      icon="delete"
                      class="q-mr-sm"
                      color="negative"
                      @click="deleteProgram(item.id as number)"
                      ><q-tooltip class="bg-white text-primary"
                        >Supprimer le programme</q-tooltip
                      ></q-btn
                    >
                  </div>
                  <q-list dense bordered separator>
                    <q-item v-for="(timer, index) in item.timers" :key="index">
                      <q-item-section>
                        <q-item-label>{{ timer.title }}</q-item-label>
                        <q-item-label caption lines="1">{{ timer.time }}</q-item-label>
                      </q-item-section>

                      <q-item-section side>
                        <q-btn
                          flat
                          round
                          color="negative"
                          icon="delete"
                          @click="onDeleteTimerToProgram(i, index)"
                        >
                          <q-tooltip class="bg-dark" :offset="[10, 10]"> supprimer </q-tooltip>
                        </q-btn>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </q-list>
          <p v-else class="q-my-lg text-center">Aucun programme n'a été créé.</p>
        </q-tab-panel>

        <q-tab-panel name="denombrement">
          <div class="text-h6">Déenombrement</div>
          Lorem ipsum dolor sit amet consectetur adipisicing elit.
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <q-dialog v-model="isCreateOrEditProgramModal" persistent>
      <q-card>
        <q-card-section class="" style="min-width: 400px">
          <h4 class="text-center">
            {{ editProgram ? 'Modifier un programme' : 'Ajouter un programme' }}
          </h4>
          <q-form class="q-gutter-md">
            <q-input
              filled
              color="accent"
              v-model="title"
              label="Titre du programme *"
              lazy-rules
              :rules="[(val) => (val && val.length > 0) || 'Please type something']"
            />

            <q-separator spaced inset vertical dark />

            <q-input
              filled
              color="accent"
              v-model="timerTitle"
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

            <q-toggle v-model="autoStop" label="Afficher 'TIME'S UP' après la fin du temps ?" />
            <q-toggle v-model="isProgressBar" label="Activer la bar de progression ?" />
            <q-btn
              color="primary"
              icon="add"
              label="Ajouter timer"
              @click="onAddTimerToProgram()"
            />
          </q-form>

          <q-list class="q-mt-lg" dense bordered separator>
            <q-item v-for="(timer, index) in timers" :key="index">
              <q-item-section>
                <q-item-label>{{ timer.title }}</q-item-label>
                <q-item-label caption lines="1">{{ timer.time }}</q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-btn flat round color="negative" icon="close" @click="onDeleteTimer(index)">
                  <q-tooltip class="bg-dark" :offset="[10, 10]"> supprimer </q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn @click="onReset()" flat label="Annuler" color="grey" v-close-popup />
          <q-btn
            @click="submitProgram()"
            :disable="!isValidForm"
            flat
            :label="!editProgram ? 'Enregistrer' : 'Modifier'"
            color="primary"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import type { Timer, Program } from 'src/components/models';
import { useProgramStore } from 'src/stores/program-store';
import { computed, onMounted, ref } from 'vue';

const $q = useQuasar();
const programStore = useProgramStore();
const tab = ref('programme');

const title = ref('');
const timerTitle = ref('');
const time = ref('00:00:15');
const autoStop = ref(true);
const isProgressBar = ref(true);

const isCreateOrEditProgramModal = ref(false);
const isDeleteProgramModal = ref(false);
const editProgram = ref<Program | null>(null);
const editOrDeleteProgramId = ref<number | null>(null);
const timers = ref<Timer[]>([]);

const isValidForm = computed(() => {
  return title.value && title.value.length > 2 && timers.value.length > 0;
});

function onOpenProgramDialog(programToEdit?: Program, programId?: number) {
  if (programToEdit && programId !== undefined) {
    editProgram.value = programToEdit;
    editOrDeleteProgramId.value = programId;
    title.value = programToEdit.title;
    timers.value = programToEdit.timers;
  }
  isCreateOrEditProgramModal.value = true;
}

function onAddTimerToProgram() {
  if (!timerTitle.value || timerTitle.value.length === 0) {
    $q.notify({
      type: 'negative',
      message: 'Le titre du timer est obligatoire !',
    });
    return;
  }

  const newTimer: Timer = {
    title: timerTitle.value,
    time: time.value,
    autoStop: autoStop.value,
    isProgressBar: isProgressBar.value,
  };

  timers.value = [...timers.value, newTimer];
  timerTitle.value = '';
  time.value = '00:00:15';
  autoStop.value = true;
  isProgressBar.value = true;
}

function onDeleteTimer(index: number) {
  timers.value = timers.value.filter((el) => el !== timers.value[index]);
}

function onDeleteTimerToProgram(programId: number, index: number) {
  $q.dialog({
    title: 'Confirmer la suppression',
    message: 'Êtes-vous sûr de vouloir supprimer ce timer du programme ?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    programStore
      .deleteTimerToProgram(programId, index)
      .then(() => {
        $q.notify({
          type: 'positive',
          message: 'Le timer a été supprimé du programme !',
        });
      })
      .catch(() => {
        $q.notify({
          type: 'negative',
          message: 'Une erreur est survenue, veuillez réessayer !',
        });
      });
  });
}

async function submitProgram() {
  const newProgram = {
    title: title.value,
    timers: timers.value.map((timer) => ({
      title: timer.title,
      time: timer.time,
      autoStop: timer.autoStop,
      isProgressBar: timer.isProgressBar,
    })),
  };

  if (editProgram.value && (editOrDeleteProgramId.value || editOrDeleteProgramId.value === 0)) {
    await programStore.editProgram(editProgram.value.id as number, newProgram);
    isCreateOrEditProgramModal.value = false;
    onReset();
    $q.notify({
      type: 'positive',
      message: 'Le programme a été modifié !',
    });
    return;
  }

  await programStore.addProgram(newProgram);
  isCreateOrEditProgramModal.value = false;
  onReset();
  $q.notify({
    type: 'positive',
    message: 'Le programme a été créé !',
  });
}

function deleteProgram(index: number) {
  $q.dialog({
    title: 'Confirmer la suppression',
    message: 'Êtes-vous sûr de vouloir supprimer ce programme ?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    programStore
      .deleteProgram(index)
      .then(() => {
        isDeleteProgramModal.value = false;
        $q.notify({
          type: 'positive',
          message: 'Le programme a été supprimé !',
        });
      })
      .catch(() => {
        $q.notify({
          type: 'negative',
          message: 'Une erreur est survenue, veuillez réessayer !',
        });
      });
  });
}

function addProgramTimersToQueue(programId: number) {
  programStore.addProgramTimersToQueue(programId);
}

function onReset() {
  title.value = '';
  timers.value = [];
  editProgram.value = null;
  editOrDeleteProgramId.value = null;
}

onMounted(async () => {
  await programStore.getPrograms();
});
</script>
