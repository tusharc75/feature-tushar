import React from "react";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import { useDrag, useDrop } from "react-dnd";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { useHistory } from "react-router-dom";
import { ListRelatedTo } from "../../Helpers/ListRelatedTo";
import {
  DeleteEvent,
  DeleteCase,
  DeleteTask,
} from "../../../../axios/activity";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles(() => ({
  activitybox: {
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    margin: "5px",
    borderRadius: "3px",
    boxShadow:
      "rgb(23 43 77 / 20%) 0px 1px 1px, rgb(23 43 77 / 20%) 0px 0px 1px",
    backgroundColor: "rgb(255, 255, 255)",
    color: "rgb(23, 43, 77)",
    padding: "8px",
  },
}));

export const BoardBox = ({ type, data, id, index, moveCard, fetchBoard }) => {
  const classes = useStyles();
  const history = useHistory();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const ref = React.useRef(null);

  const [{ handlerId }, drop] = useDrop({
    accept: "move",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover: (item: any, monitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "move",
    item: () => {
      return { id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleActivityOpen = (event) => {
    history.push({
      pathname: "/activity/" + type,
      search: "?activityType=" + type + "&activityId=" + data._id,
    });
  };

  const handleOpenMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    if (type === "event") {
      DeleteEvent(data._id)
        .then(({ data }) => {
          setAnchorEl(null);
          fetchBoard();
        })
        .catch((err) => {});
    }
    if (type === "case") {
      DeleteCase(data._id)
        .then(({ data }) => {
          setAnchorEl(null);
          fetchBoard();
        })
        .catch((err) => {});
    }
    if (type === "task") {
      DeleteTask(data._id)
        .then(({ data }) => {
          setAnchorEl(null);
          fetchBoard();
        })
        .catch((err) => {});
    }
  };

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));

  return (
    <div ref={ref} data-handler-id={handlerId}>
      <Box
        onClick={handleActivityOpen}
        className={classes.activitybox}
        style={{ opacity }}
      >
        <Box>
          <Grid container spacing={1}>
            <Grid item xs={10}>
              <Typography variant="subtitle2">{data?.name}</Typography>
            </Grid>
            <Grid item xs={2}>
              <IconButton
                size="small"
                aria-label="delete"
                onClick={handleOpenMenu}
              >
                <MoreHorizIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Box>
        <Box pt={2}>
          <ListRelatedTo relatedTo={data?.relatedTo} originRelatedTo={[]} />
        </Box>
        <Menu
          id="simple-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
        >
          <MenuItem onClick={handleDelete}>Delete</MenuItem>
        </Menu>
      </Box>
    </div>
  );
};
