import { makeStyles } from '@material-ui/core/styles';
import { Box, Tooltip } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';
import moment from 'moment';
import { displayDate } from 'src/constants/helpers';
import { Fragment } from 'react';

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

export default function CalanderList(props) {

  const { activity, expanded, selected, handleSelect, startDate, endDate, totalDay, calendarType } = props;
  const classes = useStyles();

  const getTreeNodes = (activity) => {
    return activity.map((data, index) => {
      let children = [];
      if (data.child && data.child.length) {
        children = getTreeNodes(data.child);
        children.push(<div></div>);
      }

      let label = (
        <Box width={'100%'} height={50} className="d-flex align-items-center">
          {data?.serviceOrders?.map((item) => {
            return <Tooltip title={item?.serviceOrder?.serviceOrderNumber} placement="right">
              <Box
                minWidth={calendarType !== 'week' ? '100px' : ''}
                height={45}
                borderRadius="borderRadius"
                display="flex"
                style={{
                  position: 'absolute',
                  left: (100 * moment(item.estimateStartDate).diff(startDate, 'days')) / totalDay + '%',
                  right: (100 * endDate.diff(moment(item.estimateEndDate), 'days')) / totalDay + '%'
                }}
                bgcolor="secondary.main"
                color="white"
              ></Box>
            </Tooltip>
          })}
        </Box>
      );

      return (
        <TreeItem
          key={index}
          nodeId={data._id.toString()}
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
