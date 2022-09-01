import { Button, createStyles, Dialog, Theme, makeStyles, Box, Grid, Typography } from '@material-ui/core';
import React, { useEffect } from 'react';
import { DndProvider, DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import update from 'immutability-helper';
import CustomButton from 'src/components/Helpers/CustomButton';
import IconButton from '@material-ui/core/IconButton';
import { DragIndicator } from '@material-ui/icons';
import TextField from '@material-ui/core/TextField';
import { isMobile, isTablet } from 'react-device-detect';


const ItemTypes = {
  CARD: 'card'
};

const ArrangeView = ({ data, title, handleClose, handleSubmit, loading }) => {

  const [rows, setRows] = React.useState([]);
  const [valid, setValid] = React.useState(false);
  const [fullScreen, setFullScreen] = React.useState(isMobile || isTablet);

  useEffect(() => {
    setRows(data?.sort((a, b) => a.order - b.order));
  }, [data]);

  useEffect(() => {
    if (rows?.find((x) => isNaN(x.order) || x.order <= 0 || x.order === undefined)) {
      setValid(false);
    } else {
      setValid(true);
    }
  }, [rows]);

  const moveItem = React.useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragCard = rows[dragIndex];
      const updatedIndexColumns = update(rows, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragCard]
        ]
      });
      setRows(updatedIndexColumns);
    },
    [rows]
  );

  const onChangeValue = (index, field, value) => {
    let data = [...rows];
    data[index][field] = value;
    setRows(data);
  };

  return (
    <Dialog
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
        title={title}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showRequiredLabel={false}
        showManimizeMaximize={true}
        onClose={handleClose} />
      <CustomDialogContent>
        <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
          {rows?.length ? (
            rows?.map((column: any, index) => (
              <RenderListItem key={column.field} column={column} moveItem={moveItem} index={index} onChangeValue={onChangeValue} id={column.field} />
            ))
          ) : (
            <div>No Data Found</div>
          )}
        </DndProvider>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" size="small" color="primary" onClick={handleClose}>
          Cancel
        </Button>
        <CustomButton
          loading={loading}
          variant="contained"
          color="primary"
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            handleSubmit(rows);
          }}
          disabled={loading || !valid}
        >
          Save
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const RenderListItem = ({ column, moveItem, id, index, onChangeValue }) => {
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
      <Box bgcolor="white" border={1} mb={1} p={1} borderColor="grey.300">
        <Grid container spacing={1}>
          <Grid item xs={1}>
            <Box pt={1}>
              <IconButton size="small">
                <DragIndicator fontSize="small" />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs={7}>
            <Box pt={1}>
              <Typography variant="subtitle2" gutterBottom>
                {column?.name}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <TextField
              id="standard-basic"
              name="Order"
              label="Order"
              required
              variant="outlined"
              margin="dense"
              type="number"
              fullWidth
              style={{ margin: 0 }}
              value={column?.order}
              error={isNaN(column?.order) || column?.order <= 0 || column?.order === undefined}
              onChange={(e) => onChangeValue(index, 'order', parseInt(e.target.value))}
            />
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default ArrangeView;
