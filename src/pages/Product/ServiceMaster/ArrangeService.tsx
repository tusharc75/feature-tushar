import {
  Button,
  createStyles,
  Dialog,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Switch,
  Theme,
  makeStyles
} from '@material-ui/core';
import React, { useEffect } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { DndProvider, DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { GrDrag } from 'react-icons/gr';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import update from 'immutability-helper';
import CustomButton from 'src/components/Helpers/CustomButton';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxHeight: 400,
      backgroundColor: theme.palette.background.paper
    },
    cursor: {
      cursor: 'move'
    }
  })
);

const ItemTypes = {
  CARD: 'card'
};

const ArrangeService = (props) => {
  const { data, title, onClose, onSubmit, isSubmitting } = props;
  const [sortedColumns, setSortedColumns] = React.useState([]);

  useEffect(() => {
    const sortedData = data?.sort((a, b) => a.order - b.order);
    setSortedColumns(sortedData);
  }, [data]);

  const moveItem = React.useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragCard = sortedColumns[dragIndex];
      const updatedIndexColumns = update(sortedColumns, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragCard]
        ]
      });
      // console.log(updatedIndexColumns);
      setSortedColumns(updatedIndexColumns);
    },
    [sortedColumns]
  );

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={onClose}>
      <CustomDialogHeader title={title || 'Assign'} onClose={onClose} />
      <CustomDialogContent>
        <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
          {sortedColumns?.length ? (
            sortedColumns?.map((column: any, index) => (
              <RenderListItem key={column.field} column={column} moveItem={moveItem} index={index} id={column.field} />
            ))
          ) : (
            <div>No Data Found</div>
          )}
        </DndProvider>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" disabled={isSubmitting} color="primary" onClick={onClose}>
          Cancel
        </Button>
        <CustomButton
          loading={isSubmitting}
          variant="contained"
          color="primary"
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            onSubmit(sortedColumns?.map((d) => d?._id));
          }}
          disabled={isSubmitting}
        >
          {' '}
          Save
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

interface ItemProps {
  column: any;
  moveItem: CallableFunction;
  id: string;
  index: number;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const RenderListItem = (props: ItemProps) => {
  const { column, moveItem, id, index } = props;
  const classes = useStyles();

  const ref = React.useRef<HTMLDivElement>(null);
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

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveItem(dragIndex, hoverIndex);
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

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));

  return (
    <div ref={ref} style={{ opacity }} data-handler-id={handlerId}>
      <ListItem divider disableGutters>
        <ListItemIcon className={classes.cursor}>
          <GrDrag />
        </ListItemIcon>
        <ListItemText id="switch-list-column" primary={column?.name || ''} />
      </ListItem>
    </div>
  );
};

export default ArrangeService;
