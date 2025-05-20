export type Event = {
  id?: string;
  title?: string;
  start?: Date;
  end?: Date;
  customerAccount?: string;
  allDay?: boolean;
  resource?: string;
  suffixComponent?: React.ReactNode;
  prefixConponent?: React.ReactNode;
  [key: string]: any;
};

export type View = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
