import { Box, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { TreeItem, TreeView } from '@mui/x-tree-view';
import moment from 'moment';
import { useCallback, useMemo, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn, displayDate } from '../../../../constants/helpers';
import ActivityModelHandler from '../../ActivityModelHandler';

const useStyles = makeStyles((theme: Theme) => ({
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

export default function CalendarList(props) {
  const { activity, expanded, selected, handleSelect, startDate, endDate, totalDay, calendarType, type, fetchRoadmap } = props;
  const classes = useStyles();
  const [activityData, setActivityData] = useState(null);

  const getTreeNodes = useCallback(
    (activity) => {
      return activity.map((data, index) => {
        let children = [];
        if (data.child && data.child.length) {
          children = getTreeNodes(data.child);
          children.push(<div></div>);
        }
        const left = Math.abs((100 * moment(data.startDate).diff(startDate, 'days')) / totalDay);
        const right = (100 * endDate.diff(moment(data.dueDate), 'days')) / totalDay;
        const width = 100 - (left + right);

        let label = (
          <Box width={'100%'} height={30} className="d-flex align-items-center">
            <HtmlTooltip
              className={cn('h-[20px] rounded-[4px] bg-green-500 text-white')}
              onClick={() => setActivityData({ id: data._id, type })}
              style={{
                maxWidth: calendarType !== 'week' ? `max(${width}%, 100px)` : 'unset',
                position: 'absolute',
                left: `${left}%`,
                right: `${right}%`,
                top: '50%',
                transform: 'translateY(-50%)',
                minWidth: calendarType !== 'week' ? `max(${width}%, 2px)` : '34px'
              }}
              title={data.status + ' - ' + displayDate(data.startDate) + ' - ' + displayDate(data.dueDate)}
              placement="right"
            >
              <span className="sr-only">{data.status + ' - ' + displayDate(data.startDate) + ' - ' + displayDate(data.dueDate)}</span>
            </HtmlTooltip>
          </Box>
        );

        return (
          <TreeItem
            key={index}
            itemId={data._id.toString()}
            id={data._id.toString()}
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
    },
    [calendarType, endDate, startDate, totalDay, type, classes]
  );

  let TreeNodes = useMemo(() => getTreeNodes(activity), [activity, getTreeNodes]);

  return (
    <>
      <TreeView expanded={expanded} selected={selected} onNodeSelect={handleSelect}>
        {TreeNodes.map((node) => {
          return node;
        })}
      </TreeView>
      {activityData && (
        <ActivityModelHandler
          fetchBoard={fetchRoadmap}
          setActivityData={setActivityData}
          activityType={activityData.type}
          activityId={activityData.id}
        />
      )}
    </>
  );
}
