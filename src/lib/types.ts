export type SignUp = {
  name: string;
  email: string;
  password: string;
};

export type SchedulePOST = {
  userId: string;
  description: string;
};

export type ScheduleGET = {
  id: string;
  title: string;
  dateTime: string;
  duration: string;
};
