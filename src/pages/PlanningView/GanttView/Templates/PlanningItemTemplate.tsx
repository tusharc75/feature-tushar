import { Close } from '@mui/icons-material';
import { Popover } from '@mui/material';
import { groupBy } from 'lodash';
import { memo, useState } from 'react';
import routes from 'src/components/Helpers/Routes';
import RippleButton from 'src/components/RippleButton';
import { cn, displayDate } from 'src/constants/helpers';
import { mapObjectToList, RawDay, RawDayItems } from 'src/pages/PlanningView/GanttView/utils';
import { DataSet } from 'vis-timeline/standalone';

export const PlanningItemTemplate = memo(
  ({
    data,
    resources,
    setAnchor,
    setOpen
  }: {
    data: RawDay;
    resources: any;
    setAnchor: React.Dispatch<any>;
    setOpen: React.Dispatch<React.SetStateAction<{ open: boolean; data: any[]; eventData: any }>>;
  }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const open = Boolean(anchorEl);
    if (!data) {
      return null;
    }
    return (
      <>
        <div className="my-1 space-y-1">
          {data.items?.map((d) => (
            <RenderItem data={d} resources={resources} setAnchor={setAnchor} setOpen={setOpen} />
          ))}
        </div>
        {data.allData && (
          <div className="flex p-[0px_8px_8px]">
            <RippleButton
              className="block flex-grow rounded-md bg-[var(--primary-text)] text-sm text-[white] dark:text-[black]"
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              +{data.moreDataLength} more
            </RippleButton>
            <Popover
              open={open}
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center'
              }}
              slotProps={{
                paper: {
                  className: 'dark:bg-[var(--dark-primary)] border'
                }
              }}
            >
              <div className="pb-2">
                <div className="mb-2 flex items-center justify-between gap-2 border-b bg-gray-300 py-1 pl-1 dark:bg-gray-900">
                  <p className="text-sm text-[var(--primary-text)]">{displayDate(data.start)}</p>
                  <RippleButton onClick={() => setAnchorEl(null)}>
                    <Close />
                  </RippleButton>
                </div>
                <div className="max-h-[300px] space-y-2 overflow-y-auto">
                  {data.allData.map((d) => (
                    <RenderItem data={d} resources={resources} setAnchor={setAnchor} setOpen={setOpen} />
                  ))}
                </div>
              </div>
            </Popover>
          </div>
        )}
      </>
    );
  }
);
const getColor = (data: RawDayItems) => {
  let backgroundColor = 'bg-[rgb(234,239,254)] dark:bg-[rgb(54,51,102)]',
    color = '';
  if (data?.dataType === 'credit') {
    backgroundColor = 'var(--success-light) ';
  } else if (data?.dataType === 'availableByPlanning' && data?.isRedAlert) {
    backgroundColor = 'bg-[var(--danger-light)]';
    color = 'text-[white]';
  } else if (data?.dataType === 'debit' && data?.isRedAlert) {
    backgroundColor = 'bg-[var(--danger-light)]';
    color = 'text-[white]';
  } else if (data?.dataType === 'debit') {
    backgroundColor = 'bg-[rgb(255,236,204)] dark:bg-[rgb(217,138,42)]';
  } else if (data?.dataType === 'assetStatusTotal') {
    backgroundColor = 'bg-[#89CFF0]';
  } else if (data?.dataType === 'inUseByPlanning') {
    backgroundColor = 'bg-[#FFD580]';
  }
  return { color, backgroundColor };
};
const handleClick = (
  e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  data: RawDayItems,
  setAnchor: React.Dispatch<any>,
  resources: any,
  setOpen: React.Dispatch<React.SetStateAction<{ open: boolean; data: any[]; eventData: any }>>
) => {
  if (data?.dataType === 'assetStatus' || data?.dataType === 'assetStatusTotal') {
    let query = data?.status ? `?assetStatus=${data?.status}` : `?`;
    query += `&product=${encodeURIComponent(JSON.stringify({ optionLabel: data.groupName, optionValue: data.group }))}`;
    window.open(`${routes.serializedAsset.path}${query}`);
  } else if (data?.dataType === 'availableByPlanning' || data?.dataType === 'inUseByPlanning') {
  } else if (data?.dataType) {
    setAnchor(e.currentTarget);
    const newData = data.data;
    setOpen({ open: true, data: mapObjectToList(groupBy(newData, 'resource'), resources), eventData: data });
  }
};

const RenderItem = ({
  data,
  resources,
  setAnchor,
  setOpen
}: {
  data: RawDayItems;
  resources: any;
  setAnchor: React.Dispatch<any>;
  setOpen: React.Dispatch<React.SetStateAction<{ open: boolean; data: any[]; eventData: any }>>;
}) => {
  const { backgroundColor, color } = getColor(data);
  const isClickable =
    data?.dataType === 'assetStatus' ||
    data?.dataType === 'assetStatusTotal' ||
    (!(data?.dataType === 'availableByPlanning' || data?.dataType === 'inUseByPlanning') && data?.dataType);
  return (
    <div className={cn('', isClickable ? 'cursor-pointer' : '')} onClick={(e) => handleClick(e, data, setAnchor, resources, setOpen)}>
      <div
        className={cn(
          'mx-2 overflow-hidden rounded-md border px-2 py-1',
          backgroundColor,
          color,
          !color ? 'text-black dark:text-white' : '',
          isClickable ? 'transition-shadow hover:shadow-md hover:dark:shadow-theme/20' : ''
        )}
      >
        {' '}
        <p className="text-xs">{data.title}</p>{' '}
      </div>{' '}
    </div>
  );
};
