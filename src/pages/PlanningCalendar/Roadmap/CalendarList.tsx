import { makeStyles } from '@material-ui/core/styles';
import { Box, Tooltip, Typography } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';
import moment from 'moment';
import React, { useMemo } from 'react';
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

export default function CalendarList(props) {
  const { activity, expanded, selected, handleSelect, startDate, endDate, totalDay, calendarType } = props;
  const classes = useStyles();
  const [theme] = useAppTheme();

  const types = useMemo(
    () => [
      { _id: '1', name: 'Planned', type: 'planned', color: theme === 'light' ? 'hsl(46.5deg, 95.24%, 91.76%)' : 'hsla(46.5deg, 95.24%, 66.76%, .5)' },
      { _id: '2', name: 'In-Use', type: 'inUse', color: theme === 'light' ? 'hsl(342.35deg, 100%, 96.67%)' : 'hsla(342.35deg, 100%, 66.67%, .5)' },
      {
        _id: '3',
        name: 'Available',
        type: 'available',
        color: theme === 'light' ? 'hsl(206.25deg, 100%, 96.86%)' : 'hsla(206.25deg, 100%, 66.86%, 0.5)'
      }
    ],
    [theme]
  );

  const getTreeNodes = (activity, planning = []) => {
    return activity.map((obj, i) => {
      let children = [];
      if (obj?.productName) {
        children = getTreeNodes(types, obj?.planning);
        children.push(<div></div>);
      }

      var child: any = planning?.filter((e) => e.type === obj?.type);

      let label = (
        <Box key={i} width={'100%'} height={30} className="d-flex align-items-center">
          {child?.map((data, index) => {
            return (
              <Tooltip title={data.qty} placement="right">
                <Box
                  key={index}
                  minWidth={calendarType !== 'week' ? '100px' : ''}
                  height={25}
                  borderRadius="borderRadius"
                  display="flex"
                  style={{
                    position: 'absolute',
                    backgroundColor: obj?.color || 'var(--dark--secondary, white)',
                    left: (100 * moment(data.startDate).diff(startDate, 'days')) / totalDay + '%',
                    right: (100 * endDate.diff(moment(data.endDate), 'days')) / totalDay + '%'
                  }}
                >
                  <Typography variant="subtitle2" style={{ margin: 'auto' }}>
                    {data.qty}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      );

      return (
        <TreeItem
          key={i}
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

  let TreeNodes = getTreeNodes(activity);
  return (
    <>
      <TreeView expanded={expanded} selected={selected} onNodeSelect={handleSelect}>
        {TreeNodes.map((node) => {
          return node;
        })}
      </TreeView>
    </>
  );
}
