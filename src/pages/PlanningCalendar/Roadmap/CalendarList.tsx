import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { TreeItem, TreeView } from '@material-ui/lab';
import moment from 'moment';
import { useMemo } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useAppTheme } from 'src/constants/AppConfig';

const useStyles = makeStyles((theme) => ({
  label: {
    paddingLeft: 0
  },
  iconContainer: {
    display: 'none'
  },
  group: {
    marginLeft: 0
  },
  calenderHighlights: {
    color: 'white',
    background: 'red',
    borderRadius: '4px',
    padding: '2px 5px',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden'
  }
}));

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
  const classes = useStyles();

  const getTreeNodes = (activity, planning = []) => {
    return activity.map((obj, i) => {
      let children = [];
      if (obj?.productName) {
        children = getTreeNodes(types, obj?.planning);
        children.push(<div></div>);
      }

      const child: any = planning?.filter((e) => e.type === obj?.type);

      const label = (
        <Box key={i} width={'100%'} height={30} className="d-flex align-items-center">
          {child?.map((data, index) => {
            const left = (100 * moment(data.startDate).diff(startDate, 'days')) / totalDay;
            const right = (100 * endDate.diff(moment(data.endDate), 'days')) / totalDay;

            return (
              <HtmlTooltip
                title={
                  <>
                    <p className="mx-auto my-2 max-w-fit rounded px-3 py-[2px] text-center [border:1px_solid_gray]">{data.qty}</p>
                    <p className="text-[12px] text-gray-400">
                      {moment(data.startDate).format('DD MMM YY')} - {moment(data.endDate).format('DD MMM YY')}
                    </p>
                  </>
                }
                placement="right"
                className={`rounded [border:1px_solid_var(--common-border-color)] ${obj?.color || 'var(--dark--secondary, white)'}`}
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

      return (
        <TreeItem
          key={i}
          data-id={obj?._id}
          nodeId={obj._id.toString()}
          label={label}
          children={children}
          classes={{
            group: classes.group,
            iconContainer: classes.iconContainer,
            label: classes.label
          }}
        />
      );
    });
  };

  return (
    <>
      <TreeView expanded={expanded} selected={selected} onNodeSelect={handleSelect}>
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
              <TreeNode obj={newActivity} index={row.index} endDate={endDate} startDate={startDate} totalDay={totalDay} dayPixel={dayPixel} />
            </div>
          );
        })}
      </TreeView>
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
          const left = (100 * moment(data.startDate).diff(startDate, 'days')) / totalDay;
          const right = (100 * endDate.diff(moment(data.endDate), 'days')) / totalDay;

          return (
            <HtmlTooltip
              title={
                <>
                  <p className="mx-auto my-2 max-w-fit rounded px-3 py-[2px] text-center [border:1px_solid_gray]">{data.qty}</p>
                  <p className="text-[12px] text-gray-400">
                    {moment(data.startDate).format('DD MMM YY')} - {moment(data.endDate).format('DD MMM YY')}
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
      nodeId={obj._id.toString()}
      label={label}
      children={children}
      classes={{
        iconContainer: 'hidden',
        label: 'pl-0'
      }}
    />
  );
};
