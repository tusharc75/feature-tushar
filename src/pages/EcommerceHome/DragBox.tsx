import { Box, Grid, Typography } from '@material-ui/core';
import { useDrag } from 'react-dnd';
import PropTypes from 'prop-types';

const style = {
  cursor: 'pointer',
  backgroundColor: 'white',
  paddingTop: '8px'
};

const DragBox = ({ type, label, setFormData }) => {

  const item = { _id: (Math.random() * 100000).toString(), type, label, column: "12" };

  const [{ isDragging }, drag] = useDrag({
    item: item,
    type: 'field',
    end(item, monitor) {
      const dropResult = monitor.getDropResult();
      if (dropResult) {
        setFormData((prev) => [...prev, item]);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const opacity = isDragging ? 0.4 : 1;

  return (
    <Grid ref={drag} style={{ ...style, opacity }} item xs={12} sm={12}>
      <Box border={1} p={1} borderColor="grey.300" className="text-truncate">
        <Typography variant="body2" className="text-truncate">
          {label}
        </Typography>
      </Box>
    </Grid>
  );
};

DragBox.propTypes = {
  name: PropTypes.string,
  type: PropTypes.string,
  label: PropTypes.string,
  setDraggedData: PropTypes.any
};

export default DragBox;
