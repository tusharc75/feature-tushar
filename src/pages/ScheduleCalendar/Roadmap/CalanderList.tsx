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

const types = ["planed", "required", "available"]
const colors = {
  planed: "#FEF5D6",
  required: "#FFEEF3",
  available: "#EFF8FF",
}

export default function CalanderList(props) {
  const { activity, expanded, selected, handleSelect, startDate, endDate, totalDay, calendarType } = props;
  const classes = useStyles();

  const getTreeNodes = (activity) => {

    return types.map((type, index) => {
      let children = [];
      const productQty: any = activity?.filter((e) => e.type === type)
      let label = (
        <Box key={index} width={'100%'} height={50} className="d-flex align-items-center">
          {productQty?.map((data, index) => {
            return <Tooltip title={data.qty} placement="right">
              <Box
                key={index}
                minWidth={calendarType !== 'week' ? '100px' : ''}
                height={45}
                borderRadius="borderRadius"
                display="flex"
                style={{
                  position: 'absolute',
                  backgroundColor: colors[type],
                  left: (100 * moment(data.startDate).diff(startDate, 'days')) / totalDay + '%',
                  right: (100 * endDate.diff(moment(data.endDate), 'days')) / totalDay + '%'
                }}
              >
                <Typography variant='subtitle2' style={{ margin: "auto" }}>{data.qty}</Typography>
              </Box>
            </Tooltip>
          })}
        </Box>
      );

      return (
        <TreeItem
          key={index}
          nodeId={index.toString()}
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


