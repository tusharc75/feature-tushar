import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, CircularProgress, Dialog, IconButton, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import HtmlTooltip from '../CustomTooltipTitle';
import SwapVertIcon from '@material-ui/icons/SwapVert';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import { DndProvider, useDrop, DropTargetMonitor, useDrag } from 'react-dnd';
import { XYCoord } from 'dnd-core';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import { DragIndicator } from '@material-ui/icons';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';

const ItemTypes = {
  CARD: 'card'
};

export default function ArrangeView(props) {
  const { columns, setColumns } = props;

  const [open, setOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isSubmitting, setSubmitting] = useState(false);

  const [column, setColumn] = useState([]);

  useEffect(() => {
    setColumn(columns.map((col, idx) => ({ id: idx + 1, text: col || '' })));
  }, [columns]);

  const moveCard = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragCard = column[dragIndex];
      setColumn(
        update(column, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragCard]
          ]
        })
      );
    },
    [column]
  );

  const onSave = () => {
    setSubmitting(true);
    setColumns(column.map((c) => c.text));
    setSubmitting(false);
    onClose();
  };

  const onClose = () => {
    setOpen(false);
  };

  return (
    <>
      <HtmlTooltip title="Arrange View" placement="top" arrow>
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
            title="Re-arrange sequence for columns"
            onClose={onClose}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
          />
          <CustomDialogContent>
            <List component="nav" aria-label="main mailbox folders">
              <DndProvider backend={HTML5Backend}>
                {column.map(({ text, id }, index) => (
                  <RenderListItem key={id} index={index} id={id} text={text} moveCard={moveCard} />
                ))}
              </DndProvider>
            </List>
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
  text: string;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const RenderListItem = ({ index, id, text, moveCard }: ItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.CARD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId()
      };
    },
    hover(item: DragItem, monitor: DropTargetMonitor) {
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
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
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
    type: ItemTypes.CARD,
    item: () => {
      return { id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging()
    })
  });

  drag(drop(ref));
  return (
    <div ref={ref} data-handler-id={handlerId}>
      <ListItem key={id}>
        <ListItemIcon>
          <DragIndicator />
        </ListItemIcon>
        <ListItemText primary={text} />
      </ListItem>
    </div>
  );
};
