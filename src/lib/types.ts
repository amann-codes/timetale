export type SignUp = {
  name: string;
  email: string;
  password: string;
};

export interface Flair {
  id: string;
  name: string;
  description: string;
  color: string;
}

export type Task = {
  id: string;
  title: string;
  start: Date;
  duration: number; // minutes
  flairId?: string | null;
  /** Populated when task is loaded with flair relation (e.g. for calendar). */
  flair?: Flair | null;
};

/** Input for creating a single task (manual or after AI). */
export type TaskInput = {
  title: string;
  start: Date;
  duration: number;
  flairId?: string | null;
};
