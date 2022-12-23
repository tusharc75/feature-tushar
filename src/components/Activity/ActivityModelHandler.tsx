import { CreateTask } from "./Task/CreateTask";
import { CreateEvent } from "./Event/CreateEvent";
import { CreateCase } from "./Case/CreateCase";
import { CreateNote } from "./Note/CreateNote";
import { CreateEmail } from "./Email/CreateEmail";
import ManageAttachment from "./Attachments/ManageAttachment";

import Dialog from "@material-ui/core/Dialog";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";
import { useState } from "react";

const ActivityModelHandler = (props) => {
  const { activityType, activityId, setActivityData, fetchBoard, onClose = null } = props;
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const handleClose = () => {
    if (onClose) {
      onClose()
    }
    else {
      setActivityData(null);
      fetchBoard();
    }
  };

  return (
    <Dialog
      open={true}
      fullScreen={fullScreen || (isMobile || isTablet)}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      maxWidth={"md"}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose()
          setFullScreen(false);
        }
      }}
      fullWidth
    >
      {activityType === "task" ? (
        <CreateTask taskId={activityId} handleClose={() => {
          handleClose()
          setFullScreen(false);
        }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen(prevState => !prevState)
          }}
          showManimizeMaximize={true}
        />
      ) : null}
      {activityType === "event" ? (
        <CreateEvent eventId={activityId} handleClose={() => {
          handleClose()
          setFullScreen(false);
        }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen(prevState => !prevState)
          }}
          showManimizeMaximize={true}
        />
      ) : null}
      {activityType === "case" ? (
        <CreateCase caseId={activityId} handleClose={() => {
          handleClose()
          setFullScreen(false);
        }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen(prevState => !prevState)
          }}
          showManimizeMaximize={true}
        />
      ) : null}
      {activityType === "note" ? (
        <CreateNote noteId={activityId} handleClose={() => {
          handleClose()
          setFullScreen(false);
        }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen(prevState => !prevState)
          }}
          showManimizeMaximize={true}
        />
      ) : null}
      {activityType === "email" ? (
        <CreateEmail
          emailId={activityId}
          handleClose={() => {
            handleClose()
            setFullScreen(false);
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen(prevState => !prevState)
          }}
          showManimizeMaximize={true}
        />
      ) : null}
      {activityType === "attachment" ? (
        <ManageAttachment attachmentId={activityId} handleClose={() => {
          handleClose()
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
  );
};

export default ActivityModelHandler;
