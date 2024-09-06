import { Box, Button, CircularProgress, Dialog, IconButton, ListItemIcon, ListItemText, TextField } from '@material-ui/core';
import { DragIndicator } from '@material-ui/icons';
import SwapVertIcon from '@material-ui/icons/SwapVert';
import update from 'immutability-helper';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import HtmlTooltip from '../CustomTooltipTitle';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDndSensors } from 'src/hooks';

export default function ArrangeView({ columns, setColumns }) {
  const [open, setOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isSubmitting, setSubmitting] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const [column, setColumn] = useState([]);

  useEffect(() => {
    setColumn(columns.map((e, idx) => ({ id: idx + 1, ...e })));
  }, [columns]);

  const moveCard = (event: DragEndEvent) => {
    if (!event.over) return;

    const dragIndex = event.active.data.current.index;
    const dropIndex = event.over.data.current.index;

    const dragCard = column[dragIndex];
    setColumn(
      update(column, {
        $splice: [
          [dragIndex, 1],
          [dropIndex, 0, dragCard]
        ]
      })
    );
  };

  const setColumnWidth = (id, width) => {
    setColumn(
      column.map((c) => {
        return c.id === id ? { ...c, width } : c;
      })
    );
  };

  const onDragStart = (event: DragStartEvent) => {
    if (!event?.active) return;
    setActiveItem(event.active.data.current?.props);
  };

  const onSave = () => {
    setSubmitting(true);
    setColumns(
      column.map((e) => {
        return { fieldName: e.fieldName, fieldLabel: e.fieldLabel, width: e.width };
      })
    );
    setSubmitting(false);
    onClose();
  };

  const onClose = () => {
    setOpen(false);
  };

  const sensors = useDndSensors();

  return (
    <>
      <HtmlTooltip title="Arrange Columns" placement="top" arrow>
        <IconButton
          aria-describedby="columnSelection"
          size="small"
          className="arrange-view-v1  px-2"
          color="primary"
          onClick={(event) => {
            setOpen(true);
          }}
        >
          <SwapVertIcon />
        </IconButton>
      </HtmlTooltip>
      {open && (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen || isMobile || isTablet}>
          <CustomDialogHeader
            title="Arrange Columns"
            onClose={onClose}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            showRequiredLabel={false}
          />
          <CustomDialogContent>
            <DndContext onDragEnd={moveCard} onDragStart={onDragStart} sensors={sensors} modifiers={[restrictToVerticalAxis]}>
              <SortableContext items={column?.map((c) => c.id) || []}>
                <ul className="list-none">
                  {column.map((col, index) => (
                    <RenderListItem key={col.id} index={index} id={col.id} fieldLabel={col.fieldLabel} width={col.width} setWidth={(w) => { setColumnWidth(col.id, w) }} />
                  ))}
                </ul>
              </SortableContext>
              <DragOverlay>
                <span className="[&_.drag-handle]:!cursor-grabbing">{activeItem && <RenderListItem {...activeItem} />}</span>
              </DragOverlay>
            </DndContext>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button disabled={isSubmitting} color="primary" variant="outlined" size="small" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={isSubmitting} color="primary" variant="contained" size="small" onClick={onSave}>
              {isSubmitting ? <CircularProgress size={18} /> : 'Save'}
            </Button>
          </CustomDialogFooter>
        </Dialog>
      )}
    </>
  );
}

interface ItemProps {
  id: any;
  fieldLabel: string;
  index: number;
  width: string;
  setWidth: (width: string) => void;
}

const RenderListItem = ({ index, id, fieldLabel, width, setWidth }: ItemProps) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
    data: {
      index,
      props: { index, id, fieldLabel }
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
      className={`${isDragging ? ' bg-[var(--dark-secondary,theme("colors.blue.200"))] ' : 'bg-[var(--dark-secondary,#fff)]'
        } list-none transition-colors`}
    >
      <div
        key={id}
        className={`flex items-center p-[8px_17px_8px_0] [border-bottom:1px_solid_var(--common-border-color)] ${index === 0 ? '[border-top:1px_solid_var(--common-border-color)]' : ''
          } `}
      >
        <ListItemIcon {...attributes} {...listeners} className="drag-handle !cursor-grab">
          <DragIndicator />
        </ListItemIcon>
        <ListItemText primary={fieldLabel} />
        <Box width={'150px'}>
          <TextField
            variant="outlined"
            margin="none"
            size="small"
            fullWidth
            label="Width"
            value={width}
            onChange={(e) => {
              setWidth(e?.target?.value);
            }}
          />
        </Box>
      </div>
    </li>
  );
};
