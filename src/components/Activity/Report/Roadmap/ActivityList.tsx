import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box, Button, Dialog, useMediaQuery } from '@material-ui/core';
import { TreeView, TreeItem } from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import AddIcon from '@material-ui/icons/Add';
import { isMobile, isTablet } from 'react-device-detect';
import ActivityModelHandler from '../../ActivityModelHandler';
import { CreateTask } from '../../Task/CreateTask';
import { CreateCase } from '../../Case/CreateCase';
import { useData } from '../../../../StateProvider/Provider';
import { CustomDialogTransition } from '../../../../constants/helpers';

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
  const isMobileDevices = useMediaQuery('(max-width:768px)');
  const classes = useStyles();
  const { type, fetchRoadmap, activity, expanded, selected, handleToggle, handleSelect } = props;
  const {
    state: {
      user: { user }
    }
  } = useData();
  const [isCreate, setCreate] = useState(false);
  const [activityData, setActivityData] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const closeDialog = () => {
    setCreate(false);
  };

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
      <div className="py-2">
        <Button style={{ justifyContent: 'flex-start' }} fullWidth onClick={() => setCreate(true)} startIcon={isMobileDevices ? null : <AddIcon />}>
          Create {type}
        </Button>
      </div>
      {activityData && (
        <ActivityModelHandler
          fetchBoard={fetchRoadmap}
          setActivityData={setActivityData}
          activityType={activityData.type}
          activityId={activityData.id}
        />
      )}
      {isCreate && (
        <Dialog
          open={true}
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          fullWidth
          maxWidth="md"
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              closeDialog();
              setFullScreen(false);
            }
          }}
        >
          {type === 'task' && (
            <CreateTask
              taskId={null}
              relatedTo={[{ type: 'user', referenceId: user._id, access: true }]}
              handleClose={() => {
                fetchRoadmap(false);
                closeDialog();
                setFullScreen(false);
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          )}
          {type === 'case' && (
            <CreateCase
              caseId={null}
              relatedTo={[{ type: 'user', referenceId: user._id, access: true }]}
              handleClose={() => {
                fetchRoadmap(false);
                closeDialog();
                setFullScreen(false);
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          )}
        </Dialog>
      )}
    </>
  );
}
