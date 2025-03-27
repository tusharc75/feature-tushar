import { Skeleton } from '@mui/material';
import React from 'react';
import { getRandomNumber } from 'src/components/AiChatbox/utils';
import { DEFAULT_DATA_ROWS_VISIBLE } from 'src/components/CardColTimeline1';

const CardColTimelineLoader = () => {
  return (
    <div className="h-full rounded-md bg-gray-100 dark:bg-gray-700">
      {[...Array(6).keys()].map((i) => (
        <div key={i} className="p-[8px] pb-1">
          <div className="relative flex w-full flex-col rounded-md bg-[--dark-primary,white] px-3 py-2 text-left shadow-md outline-none [--left-gutter:20px] dark:bg-[var(--dark-secondary)]">
            <div className="mb-2 flex w-full items-center justify-between border-b pb-2">
              <div className="flex">
                <Skeleton width={30} height={30} variant="circular" className="mr-2" />
                <div className="line-clamp-1">
                  <h6 className="line-clamp-1 text-[8px] font-medium text-[var(--dark-secondary-text,#8b8b8b)]">
                    <Skeleton width={getRandomNumber(50, 100)} />:
                  </h6>
                  <h4 className="quote-name line-clamp-1 [&>*]:[font-weight:700_!important] [&_*:not(.flex)]:line-clamp-1  [&_*]:[font-size:12px_!important] [&_*]:[white-space:unset_!important]">
                    <Skeleton width={getRandomNumber(50, 100)} />
                  </h4>
                </div>
              </div>
              <Skeleton width={25} height={25} variant="circular" />
            </div>
            <div className="w-full p-2">
              {[...Array(DEFAULT_DATA_ROWS_VISIBLE).keys()]?.map((d) => (
                <div className="line-clamp-1">
                  <h6 className="line-clamp-1 text-[8px] font-medium text-[var(--dark-secondary-text,#8b8b8b)]">
                    <Skeleton width={getRandomNumber(100, 200)} />:
                  </h6>
                  <h4 className="quote-name line-clamp-1 [&>*]:[font-weight:700_!important] [&_*:not(.flex)]:line-clamp-1  [&_*]:[font-size:12px_!important] [&_*]:[white-space:unset_!important]">
                    <Skeleton width={getRandomNumber(200, 300)} />
                  </h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardColTimelineLoader;
