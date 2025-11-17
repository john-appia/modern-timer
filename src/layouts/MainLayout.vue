<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-purple-7">
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Modern Timer </q-toolbar-title>

        <div>
          <q-toggle
            v-model="darkMode"
            checked-icon="mode_night"
            color="dark"
            :label="darkMode ? 'Mode nuit' : 'Mode clair'"
            unchecked-icon="sunny"
            @click="toggleDarkMode"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="drawer">
      <q-list>
        <q-item-label header> Menu </q-item-label>

        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const linksList: EssentialLinkProps[] = [
  {
    title: 'Accueil',
    icon: 'home',
    link: '/',
  },
  {
    title: 'Paramètres',
    caption: "accéder au paramètres de l'application",
    icon: 'settings',
    link: 'settings',
    disable: true,
  },
];

const leftDrawerOpen = ref(false);
const darkMode = computed(() => {
  return $q.dark.isActive;
});

function toggleDarkMode() {
  $q.dark.set(!$q.dark.isActive);
}

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>

<style lang="scss" scoped>
.body--light {
}
</style>
