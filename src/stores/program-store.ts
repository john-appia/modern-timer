import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Program } from 'src/components/models';
import { db } from 'src/db';
import { useTimerStore } from './timer-store';
import { Notify } from 'quasar';

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

export const useProgramStore = defineStore('program', {
  state: () => ({
    programs: [
      {
        title: 'Tempête de prière',
        timers: [
          {
            title: 'Direction',
            time: '00:30:00',
            autoStop: true,
            isProgressBar: true,
          },
          {
            title: 'Louange',
            time: '00:15:00',
            autoStop: true,
            isProgressBar: true,
          },
        ],
      },
      {
        title: 'Atmosphère prophétique',
        timers: [
          {
            title: 'Direction',
            time: '00:30:00',
            autoStop: true,
            isProgressBar: true,
          },
          {
            title: 'Louange',
            time: '00:15:00',
            autoStop: true,
            isProgressBar: true,
          },
        ],
      },
    ] as Program[],
  }),

  persist: {
    storage: localStorage,
    omit: ['intervalId'],
    afterHydrate(context) {
      try {
        const data = context.store.$state;

        if (!data.lastUpdate) return;

        const now = Date.now();
        const diff = now - data.lastUpdate;

        if (diff > ONE_YEAR) {
          console.warn('💥 Pinia persistence expired — resetting store');

          // Reset propre du store après expiration
          context.store.$reset();
        }
      } catch (err) {
        console.error('Error restoring store:', err);
      }
    },
  },

  getters: {
    // isLimit: (state) => state.timers.length === 10,
    // currentTimer: (state) => state.timers[0],
  },

  actions: {
    async getPrograms() {
      try {
        const items = await db.table('programs').toArray();
        this.programs = items;
        // return items;
      } catch (error) {
        console.error('Failed to fetch programs from IndexedDB:', error);
      }
    },

    async addProgram(payload: Program) {
      const cleanedPayload = structuredClone(payload);
      try {
        const id = await db.table('programs').add(cleanedPayload);
        this.programs.push({ ...cleanedPayload, id: id as number });
        // await this.getPrograms(); // Refresh the local state after adding
      } catch (error) {
        console.error('Failed to add program to IndexedDB:', error);
      }
    },

    async editProgram(id: number, payload: Program) {
      try {
        await db.table('programs').update(id, payload);
        const program = this.programs.find((program) => program.id === id);
        if (program) {
          const index = this.programs.indexOf(program);
          this.programs.splice(index, 1, { ...payload, id });
        }
      } catch (error) {
        console.error('Failed to edit program in IndexedDB:', error);
      }
    },

    async deleteProgram(id: number) {
      try {
        await db.table('programs').delete(id);
        const index = this.programs.findIndex((program) => program.id === id);
        if (index !== -1) {
          this.programs.splice(index, 1);
        }
      } catch (error) {
        console.error('Failed to delete program from IndexedDB:', error);
      }
    },

    async deleteTimerToProgram(id: number, timerIndex: number) {
      const program = this.programs[id];
      try {
        const updatedTimers = [...program!.timers];
        updatedTimers.splice(timerIndex, 1);
        await db.table('programs').update(program!.id as number, {
          timers: updatedTimers,
        });
        program!.timers = updatedTimers;
      } catch (error) {
        console.error('Failed to delete timer from program in IndexedDB:', error);
      }
    },

    addProgramTimersToQueue(programId: number) {
      const program = this.programs.find((p) => p.id === programId);
      if (program) {
        const timerStore = useTimerStore();
        timerStore.addNewProgramTimers(program.timers);
        Notify.create({
          message: `Les timers du programme "${program.title}" ont été ajoutés à la file d'attente.`,
          color: 'positive',
          position: 'top-right',
        });
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProgramStore, import.meta.hot));
}
