import dayjs from 'dayjs';

type ParsedEvents<D> = {
  start: string | Date;
  end: string | Date;
  id?: string;
  _id?: string;
} & D;

export const parseEventForMobile = <D>(events: ParsedEvents<D>[]): D[] => {
  // const parsedEvents: ParsedEvents<D>[] = [];
  const parsedEventsMap: { [key: string]: ParsedEvents<D> } = {};
  events.forEach((event) => {
    const startDate = dayjs(event.start);
    const endDate = dayjs(event.end);
    for (let date = startDate.clone(); date.isSameOrBefore(endDate); ) {
      const formattedDate = new Date(date.format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'));
      const formatOnlyDate = date.format('YYYY-MM-DD');
      const newEvent = { ...event, start: formattedDate, end: formattedDate };
      parsedEventsMap[formatOnlyDate] = newEvent;
      date = date.add(1, 'day');
    }
  });
  return Object.values(parsedEventsMap);
};

export const parseEventForMobile1 = <D>(events: ParsedEvents<D>[], startRange: Date, endRange: Date): D[] => {
  // const parsedEvents: ParsedEvents<D>[] = [];
  if (!events || events.length === 0 || !endRange) {
    return [];
  }
  const parsedEventsMap: { [key: string]: ParsedEvents<D> } = {};
  const startR = dayjs(startRange);
  const endR = dayjs(endRange);
  for (const event of events) {
    const startDate = dayjs(event.start);
    const endDate = dayjs(event.end);
    for (let date = startDate.clone(); date.isSameOrBefore(endDate); ) {
      if (date.isBefore(startR.subtract(1, 'day'))) {
        date = date.add(1, 'day');
        continue;
      }
      const formattedDate = date.toDate();
      const formatOnlyDate = date.format('YYYY-MM-DD');
      const newEvent = { ...event, start: formattedDate, end: formattedDate };
      if (event.id || event._id) {
        newEvent['_id'] = event._id;
        newEvent['id'] = `${event.id}-${formatOnlyDate}`;
      }
      parsedEventsMap[formatOnlyDate] = newEvent;
      if (date.isSameOrAfter(endR)) {
        break;
      }
      date = date.add(1, 'day');
    }
  }

  return Object.values(parsedEventsMap);
};
