import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { DateRange, MoreHoriz } from '@material-ui/icons';
import React from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { ListRelatedTo } from '../../Helpers/ListRelatedTo';
import { ColumnItem } from './type';

type SingleCardProrps = {
  type: string;
  data: ColumnItem;
  index: number;
  fetchBoard: () => void;
  setSelectedId: React.Dispatch<any>;
  canUpdate: boolean;
  canDelete: boolean;
};

const SingleCard = ({ type, data, index, fetchBoard, setSelectedId, canUpdate, canDelete }: SingleCardProrps) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleOpenMenu = (event) => {
    event.preventDefault();
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
      axiosInstance()
        .delete(`/event/${data._id}`)
        .then(() => {
          setAnchorEl(null);
          fetchBoard();
        })
        .catch((err) => {});
    }
    if (type === 'case') {
      axiosInstance()
        .delete(`/case/${data._id}`)
        .then(() => {
          setAnchorEl(null);
          fetchBoard();
        })
        .catch((err) => {});
    }
    if (type === 'task') {
      axiosInstance()
        .delete(`/task/${data._id}`)
        .then(({ data }) => {
          setAnchorEl(null);
          fetchBoard();
        })
        .catch((err) => {});
    }
  };

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: data._id,
    data: {
      type: 'Item',
      index,
      column: data.status,
      props: { type, data, index, fetchBoard, setSelectedId, canUpdate, canDelete }
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  return (
    <li
      style={style}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title={`Due Date - ${new Date(data?.dueDate).getDate() === new Date().getDate() ? 'Today' : new Date(data?.dueDate).toDateString()}`}
      className={`list-none  `}
    >
      <Box
        onClick={() => {
          if (canUpdate) {
            setSelectedId(data._id);
          }
        }}
        className={`text-[#2A3042] dark:text-white ${canUpdate ? 'cursor-pointer' : ''} ${
          isDragging ? 'opacity-50 ' : ''
        } relative mb-[14px] flex flex-col rounded-lg bg-[var(--dark-primary,white)] p-[11px_18px] shadow-[0px_3.5833494663238525px_26.8751220703125px_rgba(0,0,0,0.06)] `}
      >
        <div className="mb-[5px] flex flex-wrap items-center justify-between  gap-4">
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
          className="mb-[12px] flex items-center gap-[5px] pb-[12px] text-[#6B6B6B] dark:text-[var(--dark-secondary-text)]"
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
    </li>
  );
};

export default SingleCard;
