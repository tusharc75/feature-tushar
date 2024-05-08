import { DragDropContext, Draggable, DraggableProvidedDragHandleProps, DropResult, Droppable } from '@hello-pangea/dnd';
import { Button, CircularProgress, Dialog, IconButton, ListItemIcon, ListItemText } from '@material-ui/core';
import { DragIndicator } from '@material-ui/icons';
import SwapVertIcon from '@material-ui/icons/SwapVert';
import update from 'immutability-helper';
import { useCallback, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import HtmlTooltip from '../CustomTooltipTitle';

export default function ArrangeView({ columns, setColumns }) {
  const [open, setOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isSubmitting, setSubmitting] = useState(false);

  const [column, setColumn] = useState([]);

  useEffect(() => {
    setColumn(columns.map((e, idx) => ({ id: idx + 1, ...e })));
  }, [columns]);

  const moveCard = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const dragIndex = result.source.index;
      const dropIndex = result.destination?.index;

      const dragCard = column[dragIndex];
      setColumn(
        update(column, {
          $splice: [
            [dragIndex, 1],
            [dropIndex, 0, dragCard]
          ]
        })
      );
    },
    [column]
  );

  const onSave = () => {
    setSubmitting(true);
    setColumns(
      column.map((e) => {
        return { fieldName: e.fieldName, fieldLabel: e.fieldLabel };
      })
    );
    setSubmitting(false);
    onClose();
  };

  const onClose = () => {
    setOpen(false);
  };

  return (
    <>
      <HtmlTooltip title="Arrange Columns" placement="top" arrow>
        <IconButton
          aria-describedby="columnSelection"
          size="small"
          className="px-2  arrange-view-v1"
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
            <DragDropContext onDragEnd={moveCard}>
              <Droppable droppableId="arrangeView">
                {(provided) => (
                  <ul className="list-none" {...provided.droppableProps} ref={provided.innerRef}>
                    {column.map((col, index) => (
                      <Draggable key={col.id} draggableId={`${col.id}`} index={index}>
                        {(provided, snapshot) => (
                          <li
                            {...provided.draggableProps}
                            ref={provided.innerRef}
                            className={`${snapshot.isDragging ? ' bg-[var(--dark-secondary,#ebebeb)]' : ''} transition-colors`}
                          >
                            <RenderListItem
                              key={col.id}
                              index={index}
                              id={col.id}
                              fieldLabel={col.fieldLabel}
                              dragHandleProps={provided.dragHandleProps}
                            />
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
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
  dragHandleProps: DraggableProvidedDragHandleProps;
}

const RenderListItem = ({ index, id, fieldLabel, dragHandleProps }: ItemProps) => {
  return (
    <div
      key={id}
      className={`p-[8px_17px_8px_0] flex items-center [border-bottom:1px_solid_var(--common-border-color)] ${
        index === 0 ? '[border-top:1px_solid_var(--common-border-color)]' : ''
      } `}
    >
      <ListItemIcon {...dragHandleProps}>
        <DragIndicator />
      </ListItemIcon>
      <ListItemText primary={fieldLabel} />
    </div>
  );
};
