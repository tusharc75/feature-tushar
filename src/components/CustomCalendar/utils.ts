import dayjs from 'dayjs';

type ParsedEvents<D> = {
  start: string;
  end: string;
} & D;

export const parseEventForMobile = <D>(events: ParsedEvents<D>[]): D[] => {
  // const parsedEvents: ParsedEvents<D>[] = [];
  const parsedEventsMap: { [key: string]: ParsedEvents<D> } = {};
  events.forEach((event) => {
    const startDate = dayjs(event.start);
    const endDate = dayjs(event.end);
    for (let date = startDate.clone(); date.isSameOrBefore(endDate);) {
      const formattedDate = date.format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
      const formatOnlyDate = date.format('YYYY-MM-DD');
      const newEvent = { ...event, start: formattedDate, end: formattedDate };
      parsedEventsMap[formatOnlyDate] = newEvent;
      date = date.add(1, 'day')
    }
  });
  return Object.values(parsedEventsMap);
};
