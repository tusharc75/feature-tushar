import { groupBy } from 'lodash';
import { memo } from 'react';
import routes from 'src/components/Helpers/Routes';
import { cn } from 'src/constants/helpers';
import { mapObjectToList, RawDay } from 'src/pages/PlanningView/GanttView/utils';

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
    setOpen: React.Dispatch<
      React.SetStateAction<{
        open: boolean;
        data: any[];
        eventData: any;
      }>
    >;
  }) => {
    if (!data) {
      return null;
    }

    let backgroundColor = 'bg-[rgb(234,239,254)] dark:bg-[rgb(185,183,219)]',
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

    const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
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

    return (
      <>
        <div className=" " onClick={handleClick}>
          <div className={cn('mx-2 overflow-hidden rounded-md border px-2 py-1', backgroundColor, color, !color ? 'text-black dark:text-white' : '')}>
            <p className="text-xs">{data.title}</p>
          </div>
        </div>
      </>
    );
  }
);
