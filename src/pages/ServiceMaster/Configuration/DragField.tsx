import React from 'react';
import { Box, Grid } from '@material-ui/core';
import { useDrag } from 'react-dnd';

const DragField = ({ id, text }: any) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'field',
      item: { id, text },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      }),
      end: (item, monitor) => {
        const dropResult = monitor.getDropResult();
        // console.log(item);
      }
    }),
    [id]
  );
  return (
    <Grid item xs={12} sm={6}>
      <div ref={drag} style={{ opacity: isDragging ? 0.2 : 1 }}>
        <Box border={'1px solid lightgray'} padding={1}>
          {text}
        </Box>
      </div>
    </Grid>
  );
};

export default DragField;
