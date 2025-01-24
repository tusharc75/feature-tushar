import AddIcon from '@mui/icons-material/Add';
import { Box, Dialog, Typography, useMediaQuery } from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useCallback, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useData } from '../../../../StateProvider/Provider';
import { CustomDialogTransition } from '../../../../constants/helpers';
import ActivityModelHandler from '../../ActivityModelHandler';
import { CreateCase } from '../../Case/CreateCase';
import { CreateTask } from '../../Task/CreateTask';
import { ThemeButton } from 'src/components/Helpers/Buttons';

export default function ActivityList(props) {
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

  const getTreeNodes = useCallback(
    (treeList) => {
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
            itemId={data._id.toString()}
            id={data._id.toString()}
            label={label}
            children={children}
            sx={(theme) => ({
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
            })}
          />
        );
      });
    },
    [type]
  );

  let TreeNodes = getTreeNodes(activity);


  return (
    <>
      <SimpleTreeView
        multiSelect={false}
        expandedItems={expanded}
        onExpandedItemsChange={handleToggle}
        selectedItems={selected}
        onSelectedItemsChange={handleSelect}
      >
        {TreeNodes.map((node) => {
          return node;
        })}
      </SimpleTreeView>
      <div className="py-2">
        <ThemeButton
          onClick={() => setCreate(true)}
          iconForMobile={<AddIcon />}
          sx={{ ml: 2, mr: 2 }}
        >
          Create {type}
        </ThemeButton>
      </div >
      {activityData && (
        <ActivityModelHandler
          fetchBoard={fetchRoadmap}
          setActivityData={setActivityData}
          activityType={activityData.type}
          activityId={activityData.id}
        />
      )
      }
      {
        isCreate && (
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
        )
      }
    </>
  );
}
