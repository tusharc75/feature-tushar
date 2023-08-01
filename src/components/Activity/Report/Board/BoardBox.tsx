import React from 'react';
import { Chip, makeStyles, IconButton, Typography, Box, Grid, Menu, MenuItem } from '@material-ui/core';
import { MoreHoriz, DateRange } from '@material-ui/icons';

import { useDrag, useDrop } from 'react-dnd';
import { ListRelatedTo } from '../../Helpers/ListRelatedTo';
import { DeleteEvent, DeleteCase, DeleteTask } from '../../../../axios/activity';
import { red } from '@material-ui/core/colors';

const useStyles = makeStyles(() => ({
  activitybox: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    margin: '0px 6px 14px',
    borderRadius: '8px',
    boxShadow: '0px 3.5833494663238525px 26.8751220703125px rgba(0, 0, 0, 0.06)',
    backgroundColor: 'var(--dark-primary, rgb(255, 255, 255))',
    color: 'var(--dark-primary-text, rgb(23, 43, 77))',
    padding: '11px 18px',
    transition: 'transform .2s, background .3s',
    '&:hover': {
      transform: 'scale(1.02)',
      zIndex: '1'
      // backgroundColor: 'var(--hover_bg)'
    }
  }
}));

export const BoardBox = (props) => {
  const { type, data, id, index, moveCard, fetchBoard, handleActivityOpen, canUpdate, canDelete } = props;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const ref = React.useRef(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'move',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId()
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
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
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
    }
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'move',
    item: () => {
      return { id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

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
    if (type === 'event') {
      DeleteEvent(data._id)
        .then(({ data }) => {
          setAnchorEl(null);
          fetchBoard();
        })
        .catch((err) => {});
    }
    if (type === 'case') {
      DeleteCase(data._id)
        .then(({ data }) => {
          setAnchorEl(null);
          fetchBoard();
        })
        .catch((err) => {});
    }
    if (type === 'task') {
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
    <div
      ref={ref}
      data-handler-id={handlerId}
      title={`Due Date - ${new Date(data?.dueDate).getDate() === new Date().getDate() ? 'Today' : new Date(data?.dueDate).toDateString()}`}
    >
      <Box
        onClick={() => {
          if (canUpdate) {
            handleActivityOpen(id);
          }
        }}
        className={` ${classes.activitybox} text-[#2A3042] dark:text-white`}
        style={{ opacity }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4  mb-[5px]">
          <Typography className=" truncate" variant="subtitle2" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.57 }}>
            {data?.name}
          </Typography>
          {canDelete ? (
            <IconButton size="small" aria-label="delete" onClick={handleOpenMenu}>
              <MoreHoriz />
            </IconButton>
          ) : null}
        </div>
        <Typography
          className="flex gap-[5px] items-center text-[#6B6B6B] dark:text-[var(--dark-secondary-text)] pb-[12px] mb-[12px]"
          variant="body2"
          style={{ fontSize: 12, borderBottom: '1px solid var(--common-border-color)', marginBottom: 12 }}
        >
          <DateRange className="text-[#000] dark:text-white" style={{ fontSize: 12 }} />
          {new Date(data?.dueDate).toDateString()}
        </Typography>
        <Box>
          <ListRelatedTo relatedTo={data?.relatedTo} originRelatedTo={[]} />
        </Box>
        {canDelete ? (
          <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
            <MenuItem onClick={handleDelete}>Delete</MenuItem>
          </Menu>
        ) : null}
      </Box>
    </div>
  );
};
