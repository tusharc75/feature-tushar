import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

const useStyles = makeStyles((theme) => ({
  root: {
    '&:hover > $content': {
      backgroundColor: theme.palette.action.hover
    },
    '&:focus > $content, &$selected > $content': {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.grey[400]})`,
      color: 'var(--tree-view-color)'
    },
    '&:focus > $content $label, &:hover > $content $label, &$selected > $content $label': {
      backgroundColor: 'transparent'
    }
  },
  label: {
    paddingLeft: 0,
  },
  group: {
    paddingLeft: 0,
    '& $content': {
      paddingLeft: 0,
    },
  }
}));

const types = [{ _id: "1", name: "Planned", color: "#FEF5D6" }, { _id: "2", name: "In-Use", color: "#FFEEF3" }, { _id: "3", name: "Available", color: "#EFF8FF" }];

export default function ActivityList(props) {

  const classes = useStyles();

  const { activity, expanded, selected, handleToggle, handleSelect } = props;

  const getTreeNodes = (treeList) => {
    return treeList.map((data, index) => {
      let children = [];
      if (data?.productName) {
        children = getTreeNodes(types);
        children.push(<div></div>);
      }
      let label = (
        <Box
          width={'100%'}
          height={30}
          className="d-flex align-items-center"
          style={{ backgroundColor: data?.color || "white" }}
          onClick={(event) => {
            handleSelect(event, data);
          }}
        >
          {data?.productName ?
            <Typography variant='subtitle2'>{data?.productName}</Typography>
            : <Typography >{data?.name}</Typography>
          }
        </Box>
      );
      return (
        <TreeItem
          key={index}
          nodeId={data._id.toString()}
          label={label}
          children={children}
          classes={{
            root: classes.root,
            group: classes.group,
          }}
        />
      );
    });
  };

  let TreeNodes = getTreeNodes(activity);
  return (
    <>
      <TreeView
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        expanded={expanded}
        selected={selected}
        onNodeToggle={handleToggle}
      // onNodeSelect={handleSelect}
      >
        {TreeNodes.map((node) => {
          return node;
        })}
      </TreeView>
    </>
  );
}
