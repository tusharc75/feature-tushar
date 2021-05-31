import { useState, useCallback, useEffect, useRef } from "react";
import { Box, Button, Dialog } from "@material-ui/core";
import { Add } from "@material-ui/icons";
import { useDrop } from "react-dnd";
import update from "immutability-helper";
import { camelCase } from "lodash";
import { isMobile, isTablet } from "react-device-detect";

import { BoardBox } from "./BoardBox";
import { CreateTask } from "../../Task/CreateTask";
import { CreateCase } from "../../Case/CreateCase";
import { useData } from "../../../../StateProvider/Provider";
import { CustomDialogTransition } from "../../../../constants/helpers";

export const BoardList = ({
  status,
  type,
  activity,
  selectedResource,
  resource,
  fetchBoard,
  handleChangeStatus,
}) => {
  const {
    state: {
      user: { user },
    },
  } = useData();
  const ref = useRef(null);
  const [subActivity, setSubActivity] = useState([]);
  const [isCreateButton, setCreateButton] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

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
            [hoverIndex, 0, dragCard],
          ],
        })
      );
    },
    [subActivity]
  );

  const [{}, drop] = useDrop({
    accept: "move",
    drop: (data: any) => {
      handleChangeStatus(data.id, status);
    },
  });

  drop(ref);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    fetchBoard();
  };

  return (
    <div ref={ref} style={{ height: "calc(100% - 42px)" }}>
      <Box
        minHeight="100%"
        onMouseEnter={() => setCreateButton(true)}
        onMouseLeave={() => setCreateButton(false)}
      >
        {subActivity.map((element, index) => (
          <BoardBox
            data={element}
            key={element?._id}
            id={element?._id}
            index={index}
            type={type}
            moveCard={moveCard}
            fetchBoard={fetchBoard}
          />
        ))}

        <Box
          p={1}
          style={{
            opacity: isCreateButton || status === "To Do" ? 1 : 0,
          }}
        >
          <Button
            fullWidth
            style={{ justifyContent: "flex-start" }}
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
          >
            Create {type}
          </Button>
        </Box>
      </Box>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile || isTablet}
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
            handleClose={handleCloseDialog}
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
            handleClose={handleCloseDialog}
          />
        ) : null}
      </Dialog>
    </div>
  );
};
