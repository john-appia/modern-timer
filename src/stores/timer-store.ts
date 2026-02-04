import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Timer } from 'src/components/models';

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

export const useTimerStore = defineStore('timer', {
  state: () => ({
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
    ] as (Timer & { _seconds?: number })[],
    timerHistory: [] as Timer[],
    intervalId: null as number | null,
    autoStopTriggered: false,
    elapsedTime: 0,
    totalSeconds: 0,
    lastUpdate: Date.now(),
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
    isLimit: (state) => state.timers.length === 10,
    currentTimer: (state) => state.timers[0],
  },

  actions: {
    addNewProgramTimers(programTimers: Timer[]) {
      this.timers = [...programTimers];
    },

    addTimer(payload: Timer) {
      this.timers.push(payload);
    },

    editTimer(id: number, payload: Timer) {
      this.timers[id] = payload;
    },

    deleteTimer(id: number) {
      this.timers.splice(id, 1);
    },

    startTimer() {
      if (this.intervalId !== null) return;

      const current = this.timers[0];
      if (!current) return;

      if (!current._seconds) {
        current._seconds = this.parseTimeToSeconds(current.time);
        this.totalSeconds = current._seconds;
        this.elapsedTime = 0;
      }

      this.intervalId = setInterval(() => this.tick(), 1000) as unknown as number;
    },

    stopTimer() {
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },

    tick() {
      if (this.timers.length === 0) {
        this.stopTimer();
        return;
      }

      const current = this.timers[0];

      if (current) {
        if (!current._seconds) {
          current._seconds = this.parseTimeToSeconds(current.time);
        }

        current._seconds--;
        this.elapsedTime++;

        current.time = this.formatSecondsToTime(current._seconds);

        if (current._seconds <= 0) {
          if (current.autoStop === true) {
            this.autoStopTriggered = true;
            this.stopTimer();
            return; // NE PAS SUPPRIMER LE TIMER, ON STOPPE !
          }

          this.timerHistory.push({ ...this.timers[0]!, time: '00:00:00' });
          this.timers.shift();

          if (this.timers.length === 0) {
            this.stopTimer();
          } else {
            const next = this.timers[0];
            delete next!._seconds;

            // init pour le prochain
            next!._seconds = this.parseTimeToSeconds(next!.time);
            this.totalSeconds = next!._seconds!;
            this.elapsedTime = 0;
          }
        }
      }
    },

    parseTimeToSeconds(time: string) {
      const parts = time.split(':').map(Number);
      if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
      if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
      return 0;
    },

    formatSecondsToTime(total: number) {
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;

      return h > 0
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m}:${s.toString().padStart(2, '0')}`;
    },
    continueAfterAutoStop() {
      this.autoStopTriggered = false;

      // Supprimer le timer terminé
      this.timerHistory.push({ ...this.timers[0]!, time: '00:00:00' });
      this.timers.shift();

      if (this.timers.length > 0) {
        delete this.timers[0]!._seconds;
        this.startTimer(); // Reprendre
      }
    },
    addHistoryToTimer() {
      if (this.timerHistory.length) {
        this.timers = [...this.timers, ...this.timerHistory];
        this.timerHistory = [];
      }
    },
    addSecondsToCurrentTimer(seconds: number) {
      console.log(seconds);
      if (this.timers[0]?._seconds) {
        console.log(this.timers[0]);
        this.timers[0]._seconds += seconds;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTimerStore, import.meta.hot));
}
