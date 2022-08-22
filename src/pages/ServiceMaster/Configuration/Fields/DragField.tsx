import { Box, Grid } from '@material-ui/core';
import { useDrag } from 'react-dnd';

const DragField = ({ _id, text }: any) => {

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'field',
      item: { _id, text },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      }),
      end: (item, monitor) => {
        const dropResult = monitor.getDropResult();
      }
    }),
    [_id]
  );

  return (
    <Grid item xs={12} sm={12}>
      <div ref={drag} style={{ cursor: "pointer", opacity: isDragging ? 0.2 : 1 }}>
        <Box border={'1px solid lightgray'} padding={1}>
          {text}
        </Box>
      </div>
    </Grid>
  );
};

export default DragField;
