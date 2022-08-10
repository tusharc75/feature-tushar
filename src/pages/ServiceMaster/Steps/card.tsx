import { Box, Grid, IconButton, MenuItem, Select, TextField } from '@material-ui/core';
import { DragIndicator } from '@material-ui/icons';
import { useRef } from 'react';
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';

interface DragItem {
  index: number;
  id: string;
  type: string;
}
export const Card = (props) => {
  const { index, id, data, moveCard, onChangeValue, AddRemoveValue } = props;
  // console.log(index, id, data);
  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop({
    accept: 'card',
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
    type: 'card',
    item: () => {
      return { id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging()
    })
  });
  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));
  // console.log(data.optionLabel);
  return (
    <div ref={ref} style={{ opacity }} data-handler-id={handlerId}>
      <Box bgcolor="white" border={1} mb={1} p={1} borderColor="grey.300">
        <Grid container spacing={1}>
          <Grid item xs={1}>
            <IconButton>
              <DragIndicator />
            </IconButton>
          </Grid>
          <Grid item xs={9}>
            <TextField
              id="standard-basic"
              variant="outlined"
              margin="dense"
              fullWidth
              style={{ margin: 0 }}
              value={data?.step || ''}
              onChange={(e) => onChangeValue(index, e.target.value)}
            />
          </Grid>

          <Grid item xs={2}>
            <IconButton aria-label="setting" onClick={() => AddRemoveValue('add', index)}>
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label="setting" onClick={() => AddRemoveValue('remove', index)}>
              <RemoveCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};
