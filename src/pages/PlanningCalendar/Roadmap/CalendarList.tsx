import { Box, Typography } from '@mui/material';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import dayjs from 'dayjs';
import React from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { displayDateTime } from 'src/constants/helpers';

const types = [
  { _id: '1', name: 'Planned', type: 'planned', color: '!bg-[hsl(46.5deg,95.24%,91.76%)] dark:!bg-[#dda900]' },
  { _id: '2', name: 'In-Use', type: 'inUse', color: '!bg-[hsl(342.35deg,100%,96.67%)] dark:!bg-[#cd3865]' },
  {
    _id: '3',
    name: 'Available',
    type: 'available',
    color: '!bg-[hsl(206.25deg,100%,96.86%)] dark:!bg-[#176fb2]'
  }
];

export default function CalendarList({
  activity,
  expanded,
  selected,
  handleSelect,
  startDate,
  endDate,
  totalDay,
  stateDateFormat,
  dayPixel,
  rowVirtualizer
}) {
  return (
    <>
      <SimpleTreeView multiSelect={false} expandedItems={expanded} selectedItems={selected} onSelectedItemsChange={handleSelect}>
        {rowVirtualizer.getVirtualItems().map((row) => {
          const newActivity = activity[row.index];
          return (
            <div
              data-index={row.index}
              data-id={newActivity?._id}
              ref={(node) => rowVirtualizer.measureElement(node)}
              className="absolute left-0 top-0 w-full transition-all duration-300"
              key={newActivity._id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translateY(${row.start - rowVirtualizer.options.scrollMargin}px)`
              }}
            >
              <MemoizedTreeNode obj={newActivity} index={row.index} endDate={endDate} startDate={startDate} totalDay={totalDay} dayPixel={dayPixel} />
            </div>
          );
        })}
      </SimpleTreeView>
    </>
  );
}

const TreeNode = ({ obj, index, endDate, startDate, totalDay, dayPixel }) => {
  const label = <Box key={index} width={'100%'} height={30} className="d-flex align-items-center"></Box>;

  const children = types?.map((t, index) => {
    const data = obj?.planning?.filter((e) => e.type === t.type);

    return (
      <Box key={index} width={'100%'} height={30} className="hover:bg-[var(--dark-secondary,#eef5f4)]">
        {data.map((data, i) => {
          const left = (100 * dayjs(data.startDate).diff(startDate, 'days')) / totalDay;
          const right = (100 * endDate.diff(dayjs(data.endDate), 'days')) / totalDay;

          return (
            <HtmlTooltip
              title={
                <>
                  <p className="mx-auto my-2 max-w-fit rounded px-3 py-[2px] text-center [border:1px_solid_gray]">{data.qty}</p>
                  <p className="text-[12px] text-gray-400">
                    {displayDateTime(data.startDate, 'DD MMM YY')} - {displayDateTime(data.endDate, 'DD MMM YY')}
                  </p>
                </>
              }
              placement="right"
              className={` rounded [border:1px_solid_var(--common-border-color)] ${t?.color || 'var(--dark--secondary, white)'}`}
              style={{
                position: 'absolute',
                left: `${Math.max(left)}%`,
                right: `max(${Math.max(right)}%, -${dayPixel}px)`,
                minWidth: dayPixel
              }}
            >
              <Box key={index} minWidth={dayPixel} height={25} borderRadius="borderRadius" display="flex">
                <Typography variant="subtitle2" style={{ margin: 'auto' }}>
                  {data.qty}
                </Typography>
              </Box>
            </HtmlTooltip>
          );
        })}
      </Box>
    );
  });

  return (
    <TreeItem
      key={index}
      data-id={obj?._id}
      itemId={obj._id.toString()}
      id={obj._id.toString()}
      label={label}
      children={children}
      classes={{
        iconContainer: 'hidden',
        label: 'pl-0'
      }}
    />
  );
};

const MemoizedTreeNode = React.memo(TreeNode);
