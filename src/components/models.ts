export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export type Timer = {
  title: string;
  time: string;
  autoStop: boolean;
  isProgressBar: boolean;
};

export type Program = {
  id?: number;
  title: string;
  timers: Timer[];
};
