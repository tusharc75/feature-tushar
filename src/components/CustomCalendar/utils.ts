import moment from 'moment';

type ParsedEvents<D> = {
  start: string;
  end: string;
} & D;

export const parseEventForMobile = <D>(events: ParsedEvents<D>[]): D[] => {
  // const parsedEvents: ParsedEvents<D>[] = [];
  const parsedEventsMap: { [key: string]: ParsedEvents<D> } = {};
  events.forEach((event) => {
    const startDate = moment(event.start);
    const endDate = moment(event.end);
    for (let date = startDate.clone(); date.isSameOrBefore(endDate); date.add(1, 'days')) {
      const formattedDate = date.format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
      const formatOnlyDate = date.format('YYYY-MM-DD');
      const newEvent = { ...event, start: formattedDate, end: formattedDate };
      parsedEventsMap[formatOnlyDate] = newEvent;
    }
  });
  return Object.values(parsedEventsMap);
};
