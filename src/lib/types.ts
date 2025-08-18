export type SignUp = {
  name: string;
  email: string;
  password: string;
};

export type CreateSchedule = {
  userId: string;
  description: string;
  flairIds: string[];
};

export interface Flair {
  id: string
  name: string
  description: string
  color: string
}

export type Schedule = {
  id: string;
  title: string;
  duration: string;
  dateTime: Date;
  flairId: string;
}

export type ScheduleDOC = {
  id: string;
  schedule: Schedule[];
}