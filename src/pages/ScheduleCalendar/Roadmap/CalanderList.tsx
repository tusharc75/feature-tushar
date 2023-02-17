import { makeStyles } from '@material-ui/core/styles';
import { Box, Tooltip, Typography } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';
import moment from 'moment';

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
  { _id: "1", name: "Planned", type: "planned", color: "#FEF5D6" },
  { _id: "2", name: "In-Use", type: "inUse", color: "#FFEEF3" },
  { _id: "3", name: "Available", type: "available", color: "#EFF8FF" }
];

export default function CalanderList(props) {
  const { activity, expanded, selected, handleSelect, startDate, endDate, totalDay, calendarType } = props;
  const classes = useStyles();

  const getTreeNodes = (activity, schedule = []) => {
    return activity.map((obj, i) => {

      let children = [];
      if (obj?.productName) {
        children = getTreeNodes(types, obj?.schedule);
        children.push(<div></div>);
      }

      var child: any = schedule?.filter((e) => e.type === obj?.type)
    
      let label = (<Box
        key={i}
        width={'100%'}
        height={30}
        className="d-flex align-items-center">
        {child?.map((data, index) => {
          return <Tooltip title={data.qty} placement="right">
            <Box
              key={index}
              minWidth={calendarType !== 'week' ? '100px' : ''}
              height={25}
              borderRadius="borderRadius"
              display="flex"
              style={{
                position: 'absolute',
                backgroundColor: obj?.color || "white",
                left: (100 * moment(data.startDate).diff(startDate, 'days')) / totalDay + '%',
                right: (100 * endDate.diff(moment(data.endDate), 'days')) / totalDay + '%'
              }}
            >
              <Typography variant='subtitle2' style={{ margin: "auto" }}>{data.qty}</Typography>
            </Box>
          </Tooltip>
        })}
      </Box>);

      return (
        <TreeItem
          key={i}
          nodeId={obj._id.toString()}
          label={label}
          children={children}
          classes={{
            group: classes.group,
            iconContainer: classes.iconContainer,
            label: classes.label,
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


