import React, { useState, useCallback, useEffect } from "react";
import { Box } from "@material-ui/core";
import { useDrop } from "react-dnd";
import update from "immutability-helper";
import { BoardBox } from "./BoardBox";

export const BoardList = ({
  status,
  type,
  activity,
  fetchBoard,
  handleChangeStatus,
}) => {
  const ref = React.useRef(null);
  const [subActivity, setSubActivity] = useState([]);

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
  return (
    <div ref={ref} style={{ height: "calc(100% - 42px)" }}>
      <Box minHeight="100%">
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
      </Box>
    </div>
  );
};
