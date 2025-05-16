export type Event = {
  id?: string;
  title?: string;
  start?: Date;
  end?: Date;
  customerAccount?: string;
  allDay?: boolean;
  resource?: string;
  [key: string]: any;
};

export type View = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
