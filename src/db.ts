import type { Table } from 'dexie';
import Dexie from 'dexie';
import type { Program } from './components/models';

export class AppDB extends Dexie {
  programs!: Table<Program, number>;

  constructor() {
    super('MiesiDatabase');
    this.version(1).stores({
      programs: '++id, title',
    });
  }
}

export const db = new AppDB();
