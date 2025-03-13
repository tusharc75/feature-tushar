import { Box, Dialog, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { DragIndicator } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { changeItemIndex, CustomDialogTransition } from 'src/constants/helpers';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDndSensors } from 'src/hooks';
import { isEqual } from 'lodash';

const ArrangeRowDialog = ({ state, handleClose, handleSuccess, loading }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [activeItem, setActiveItem] = useState(null);

  const { dataRows } = state;

  const [rows, setRows] = useState([...dataRows]);

  const onDragStart = (event: DragStartEvent) => {
    if (!event.active) return;
    setActiveItem(event.active.data.current.props);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    if (!event.over) return;
    const { active, over } = event;
    const dragIndex = active.data.current?.index;
    const dropIndex = over.data.current?.index;

    if (active.id === over.id) return;

    const updatedIndexColumns = changeItemIndex(rows, rows[dragIndex], dragIndex, dropIndex);
    setRows(updatedIndexColumns);
  };

  const sensors = useDndSensors();

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      open
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      maxWidth="sm"
    >
      <CustomDialogHeader
        title={'Arrange'}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showRequiredLabel={false}
        showManimizeMaximize={true}
        onClose={handleClose}
      />
      <CustomDialogContent>
        <DndContext onDragEnd={onDragEnd} onDragStart={onDragStart} sensors={sensors}>
          <SortableContext items={rows.map((c) => c._id)} strategy={verticalListSortingStrategy}>
            <ul className="list-none space-y-2">
              {rows.map((_data, index) => {
                return <RenderListItem key={_data._id} data={_data} index={index} />;
              })}
            </ul>
          </SortableContext>
          <DragOverlay>
            {activeItem && (
              <span className="[&_.MuiIconButton-root]:!cursor-grabbing">
                <RenderListItem {...activeItem} />
              </span>
            )}
          </DragOverlay>
        </DndContext>
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType="transparent" onClick={handleClose}>
          Cancel
        </ThemeButton>
        <ThemeButton
          isLoading={loading}
          buttonType="theme"
          onClick={(e) => {
            e.preventDefault();
            handleSuccess(rows);
          }}
          disabled={isEqual(dataRows, rows)}
        >
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

const RenderListItem = ({ data, index }) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: data._id,
    data: {
      index,
      props: { data, index }
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
      className={`${
        isDragging ? ' bg-[var(--dark-secondary,theme("colors.blue.200"))]' : 'bg-[var(--dark-secondary,#fff)]'
      } list-none transition-colors`}
    >
      <Box bgcolor="var(--dark-primary, white)" border={1} borderColor="var(--common-border-color)">
        <div className="flex items-center gap-5 p-1">
          <div>
            <IconButton size="small" {...attributes} {...listeners} className=" drag-handle !cursor-grab">
              <DragIndicator fontSize="small" />
            </IconButton>
          </div>
          <div className="mt-1">
            <Typography variant="subtitle2" gutterBottom>
              {`${data?.index} - ${data?.detail}`}
            </Typography>
          </div>
        </div>
      </Box>
    </li>
  );
};

export default ArrangeRowDialog;
