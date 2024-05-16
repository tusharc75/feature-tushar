import { Box, Button, Dialog } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import { camelCase } from 'lodash';
import { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useData } from '../../../../StateProvider/Provider';
import { CustomDialogTransition } from '../../../../constants/helpers';
import ActivityModelHandler from '../../ActivityModelHandler';
import { CreateCase } from '../../Case/CreateCase';
import { CreateTask } from '../../Task/CreateTask';
import { BoardBox } from './BoardBox';

import { Droppable } from '@hello-pangea/dnd';

export const BoardList = ({ status, type, activity, selectedResource, resource, fetchBoard, loading }) => {
  const {
    state: {
      user: { user },
      permissions
    }
  } = useData();

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleActivityOpen = (id) => {
    setSelectedId(id);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    fetchBoard();
  };

  return (
    <>
      <div style={{ height: 'calc(100% - 110px)' }}>
        <>
          {!loading ? (
            <>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <ul
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`list-none h-full min-h-[475px] ${
                      snapshot.draggingOverWith ? 'bg-blue-200 dark:bg-gray-900' : ''
                    } transition-colors duration-200`}
                  >
                    {activity.map((element, index) => (
                      <BoardBox
                        data={element}
                        key={element?._id}
                        id={element?._id}
                        index={index}
                        type={type}
                        canUpdate={permissions[type?.toLowerCase()]?.isUpdate}
                        canDelete={permissions[type?.toLowerCase()]?.isDelete}
                        fetchBoard={fetchBoard}
                        handleActivityOpen={handleActivityOpen}
                      />
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </>
          ) : (
            <Box p={1}></Box>
          )}
        </>

        {selectedId && <ActivityModelHandler setActivityData={setSelectedId} activityType={type} fetchBoard={fetchBoard} activityId={selectedId} />}
        <Dialog
          open={openDialog}
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              handleCloseDialog();
              setFullScreen(false);
            }
          }}
          fullWidth
          maxWidth="md"
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
        >
          {type === 'task' ? (
            <CreateTask
              status={status}
              taskId={null}
              relatedTo={[
                {
                  type: resource && selectedResource ? camelCase(resource) : 'user',
                  referenceId: resource && selectedResource ? selectedResource.id : user._id,
                  access: true
                }
              ]}
              handleClose={() => {
                handleCloseDialog();
                setFullScreen(false);
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          ) : type === 'case' ? (
            <CreateCase
              status={status}
              caseId={null}
              relatedTo={[
                {
                  type: resource && selectedResource ? camelCase(resource) : 'user',
                  referenceId: resource && selectedResource ? selectedResource.id : user._id,
                  access: true
                }
              ]}
              handleClose={() => {
                handleCloseDialog();
                setFullScreen(false);
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          ) : null}
        </Dialog>
      </div>
      {permissions && permissions[type?.toLowerCase()]?.isCreate && !loading ? (
        <Box p={1} className=" group-hover:opacity-100 opacity-0">
          <Button
            fullWidth
            style={{ justifyContent: 'flex-start' }}
            startIcon={<Add />}
            onClick={() => {
              setOpenDialog(true);
              setFullScreen(false);
            }}
          >
            Create {type}
          </Button>
        </Box>
      ) : null}
    </>
  );
};
