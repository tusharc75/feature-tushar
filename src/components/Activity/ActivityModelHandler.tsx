import { CreateTask } from "./Task/CreateTask";
import { CreateEvent } from "./Event/CreateEvent";
import { CreateCase } from "./Case/CreateCase";
import { CreateNote } from "./Note/CreateNote";
import { CreateEmail } from "./Email/CreateEmail";
import Dialog from "@material-ui/core/Dialog";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";

const ActivityModelHandler = (props) => {
  const { activityType, activityId, setActivityData, fetchBoard, onClose = null } = props;

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
      fullScreen={isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      maxWidth={"md"}
      onClose={handleClose}
      fullWidth
    >
      {activityType === "task" ? (
        <CreateTask taskId={activityId} handleClose={handleClose} />
      ) : null}
      {activityType === "event" ? (
        <CreateEvent eventId={activityId} handleClose={handleClose} />
      ) : null}
      {activityType === "case" ? (
        <CreateCase caseId={activityId} handleClose={handleClose} />
      ) : null}
      {activityType === "note" ? (
        <CreateNote noteId={activityId} handleClose={handleClose} />
      ) : null}
      {activityType === "email" ? (
        <CreateEmail emailId={activityId} handleClose={handleClose} />
      ) : null}
    </Dialog>
  );
};

export default ActivityModelHandler;
