import { EventContentArg } from '@fullcalendar/core';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

export function renderEventContent(eventInfo: EventContentArg) {
  return (
    <>
      {eventInfo.timeText && <b>{eventInfo.timeText}</b>}
      <p className="px-[5px] py-[2px] text-xs font-medium">
        {eventInfo.event.extendedProps.prefixConponent ? eventInfo.event.extendedProps.prefixConponent : null}{' '}
        <span className=" align-middle">{eventInfo.event.title} </span>
        {eventInfo.event.extendedProps.suffixComponent ? eventInfo.event.extendedProps.suffixComponent : null}
      </p>
    </>
  );
}

export function renderEventContentForMonthViewMobile(eventInfo: EventContentArg) {
  return (
    <>
      {eventInfo.timeText && <b>{eventInfo.timeText}</b>}
      <HtmlTooltip
        title={
          <>
            <span className="">{eventInfo.event.extendedProps.prefixConponent ? eventInfo.event.extendedProps.prefixConponent : null}</span>
            <span className=" align-middle ">{eventInfo.event.title} </span>
            <span className="">{eventInfo.event.extendedProps.suffixComponent ? eventInfo.event.extendedProps.suffixComponent : null}</span>
          </>
        }
      >
        <p className="p-1 ">
          <span className="sr-only">{eventInfo.event.extendedProps.prefixConponent ? eventInfo.event.extendedProps.prefixConponent : null}</span>
          <span className=" sr-only align-middle">{eventInfo.event.title} </span>
          <span className="sr-only">{eventInfo.event.extendedProps.suffixComponent ? eventInfo.event.extendedProps.suffixComponent : null}</span>
        </p>
      </HtmlTooltip>
    </>
  );
}
