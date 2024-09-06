import React, { useState } from 'react';
import moment from 'moment';
import { getDaysBetweenDates } from 'src/components/Roadmap/utils';

type RoadmapProps<T> = {
  sidebarHeaderName: string | React.ReactNode;
  data: T[];
  sidebarItemRenderer: (data: T, index: number) => React.ReactNode;
  contentItemRenderer: (data: T, index: number) => React.ReactNode;
  getContentStartDate: (data: T) => moment.Moment;
  getContentEndDate: (data: T) => moment.Moment;
  startDate?: moment.Moment;
  endDate?: moment.Moment;
  sidebarItemOnClick?: (data: T, index: number) => void;
  contentItemOnClick?: (data: T, index: number) => void;
  showViewChanger?: boolean;
};

function Roadmap<T>({
  sidebarHeaderName,
  data,
  sidebarItemRenderer,
  contentItemRenderer,
  getContentStartDate,
  getContentEndDate: contentEndDate,
  startDate = moment().startOf('year'),
  endDate = moment().endOf('year'),
  sidebarItemOnClick,
  contentItemOnClick,
  showViewChanger
}: RoadmapProps<T>) {
  const tempData = data.slice(0, 25);
  const [calendarType, setCalendarType] = useState<'week' | 'month' | 'quarter'>('week');

  return (
    <div className="h-[calc(100vh-200px)] overflow-auto [--primary-hover-bg:#dfdfdf] [border:1px_solid_var(--common-border-color)] dark:[--primary-hover-bg:var(--dark-secondary)]">
      <div className="table-container">
        <div className="sidebar sticky left-0  z-10 w-full max-w-[300px] bg-[var(--dark-primary,white)] [border-right:1px_solid_var(--common-border-color)]">
          <h6 className="sidebar-head sticky top-0 z-10 bg-[var(--dark-primary,white)] px-3 py-4 text-lg font-semibold [border-bottom:1px_solid_var(--common-border-color)]">
            {sidebarHeaderName}
          </h6>
          <div className="sidebar-body isolate ">
            {tempData.map((item, index) => (
              <div
                key={index}
                className="sidebar-item cursor-pointer px-3 py-4 hover:bg-[var(--primary-hover-bg)]"
                onClick={() => sidebarItemOnClick && sidebarItemOnClick(item, index)}
              >
                <div className="-z-[1]">{sidebarItemRenderer(item, index)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Roadmap;
