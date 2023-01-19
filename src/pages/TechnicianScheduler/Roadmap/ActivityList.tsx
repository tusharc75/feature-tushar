import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box, Button, Dialog } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import AddIcon from '@material-ui/icons/Add';
import { isMobile, isTablet } from 'react-device-detect';
import { useData } from 'src/StateProvider/Provider';
import ActivityModelHandler from 'src/components/Activity/ActivityModelHandler';
import { CustomDialogTransition } from 'src/constants/helpers';

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
    paddingLeft: 0
  },
  group: {
    marginLeft: 0
  }
}));

export default function ActivityList(props) {
  const classes = useStyles();
  const { type, fetchRoadmap, activity, expanded, selected, handleToggle, handleSelect } = props;
  console.log(activity);
  const {
    state: {
      user: { user }
    }
  } = useData();
  const [activityData, setActivityData] = useState(null);

  const getTreeNodes = (treeList) => {
    return treeList.map((data, index) => {
      let children = [];
      if (data.child && data.child.length > 0) {
        children = getTreeNodes(data.child);
        children.push(<div></div>);
      }

      let label = (
        <Box width={'100%'} height={30} className="d-flex align-items-center">
          <Box width={'100%'} style={{ position: 'absolute' }}>
            <Box onClick={() => setActivityData({ id: data._id, type })}>
              <Typography variant="body2" className="text-truncate">
                {data.name}
              </Typography>
            </Box>
          </Box>
        </Box>
      );

      return (
        <TreeItem
          key={index}
          nodeId={data._id.toString()}
          label={label}
          children={children}
          classes={{
            root: classes.root
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
        onNodeSelect={handleSelect}
      >
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
