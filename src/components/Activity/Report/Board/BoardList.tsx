import { useState, useCallback, useEffect, useRef } from 'react';
import { Box,Button,Dialog } from '@material-ui/core';
import { useDrop } from 'react-dnd';
import update from 'immutability-helper';
import { BoardBox } from './BoardBox';
import { Add } from "@material-ui/icons";
import { isMobile, isTablet } from "react-device-detect";
import { useData } from '../../../../StateProvider/Provider';
import { CreateTask } from "../../Task/CreateTask";
import { CreateCase } from "../../Case/CreateCase";
import { camelCase } from "lodash";
import ActivityModelHandler from '../../ActivityModelHandler';
import { CustomDialogTransition } from "../../../../constants/helpers";

export const BoardList = ({ status, type, activity, selectedResource, resource, fetchBoard, handleChangeStatus, loading }) => {
  const {
    state: {
      user: { user },
      permissions
    }
  } = useData();
  const ref = useRef(null);
  const [subActivity, setSubActivity] = useState([]);
  const [isCreateButton, setCreateButton] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    setSubActivity(activity);
  }, [activity]);

  const moveCard = useCallback(
    (dragIndex, hoverIndex) => {
      const dragCard = subActivity[dragIndex];
      setSubActivity(
        update(subActivity, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragCard]
          ]
        })
      );
    },
    [subActivity]
  );

  const [{ }, drop] = useDrop({
    accept: 'move',
    drop: (data: any) => {
      handleChangeStatus(data.id, status, data.index);
    }
  });

  drop(ref);

  const handleActivityOpen = (id) => {
    setSelectedId(id);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    fetchBoard();
  };


  return (
    <div ref={ref} style={{ height: 'calc(100% - 42px)' }}>
      <Box 
      minHeight="100%" 
      onMouseEnter={() => setCreateButton(true)} 
      onMouseLeave={() => setCreateButton(false)}
      >
        {!loading ? (
          <>
            {subActivity.map((element, index) => (
              <BoardBox
                data={element}
                key={element?._id}
                id={element?._id}
                index={index}
                type={type}
                canUpdate={permissions[type?.toLowerCase()]?.isUpdate}
                canDelete={permissions[type?.toLowerCase()]?.isDelete}
                moveCard={moveCard}
                fetchBoard={fetchBoard}
                handleActivityOpen={handleActivityOpen}
              />
            ))}
              {
              permissions && permissions[type?.toLowerCase()]?.isCreate ?
                <Box
                  p={1}
                  style={{
                    opacity: isCreateButton || status === "To Do" ? 1 : 0,
                  }}>
                  <Button
                    fullWidth
                    style={{ justifyContent: "flex-start" }}
                    startIcon={<Add />}
                    onClick={() => {
                      setOpenDialog(true)
                      setFullScreen(false);
                    }}
                  >
                    Create {type}
                  </Button>
                </Box>
                : null
            }
          </>
        ) : (
          <Box p={1}></Box>
        )}
      </Box>

      {selectedId && 
      <ActivityModelHandler 
      setActivityData={setSelectedId} 
      activityType={type} 
      fetchBoard={fetchBoard} 
      activityId={selectedId} />
      }
       <Dialog
        open={openDialog}
        onClose={() => {
          handleCloseDialog();
          setFullScreen(false);
        }}
        fullWidth
        maxWidth="md"
        fullScreen={fullScreen || (isMobile || isTablet)}
        TransitionComponent={CustomDialogTransition}
      >
        {type === "task" ? (
          <CreateTask
            status={status}
            taskId={null}
            relatedTo={[
              {
                type:
                  resource && selectedResource ? camelCase(resource) : "user",
                referenceId:
                  resource && selectedResource ? selectedResource.id : user._id,
                access: true,
              },
            ]}
            handleClose={() => {
              handleCloseDialog()
              setFullScreen(false);
            }}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen(prevState => !prevState)
            }}
            showManimizeMaximize={true}
          />
        ) : type === "case" ? (
          <CreateCase
            status={status}
            caseId={null}
            relatedTo={[
              {
                type:
                  resource && selectedResource ? camelCase(resource) : "user",
                referenceId:
                  resource && selectedResource ? selectedResource.id : user._id,
                access: true,
              },
            ]}
            handleClose={() => {
              handleCloseDialog()
              setFullScreen(false);
            }}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen(prevState => !prevState)
            }}
            showManimizeMaximize={true}

          />
        ) : null}
      </Dialog>
    </div>
  );
};
