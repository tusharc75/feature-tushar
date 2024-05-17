import { Draggable } from '@hello-pangea/dnd';
import { Box, Grid, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';

const style = {
  backgroundColor: 'var(--dark-primary, white)'
};

const DragBox = ({ item, index }) => {
  return (
    <>
      <Draggable key={item._id} draggableId={`${item._id}`} index={index}>
        {(provided, snapshot) => (
          <>
            <li
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={provided.draggableProps.style}
              className={`${snapshot.isDragging ? ' bg-[var(--dark-secondary,#ebebeb)]' : ''} transition-colors`}
            >
              <Item dashedBorder={snapshot.isDragging} item={item} />
            </li>
            {snapshot.isDragging && <Item item={item} />}
          </>
        )}
      </Draggable>
    </>
  );
};

const Item = ({ dashedBorder = false, item }) => {
  return (
    <Grid item xs={12} sm={12}>
      <Box
        border={1}
        p={1}
        style={{ ...style }}
        borderColor="var(--common-border-color)"
        className={`text-truncate ${dashedBorder ? ' !border-dashed' : ''}`}
      >
        <Typography variant="body2" className="text-truncate">
          {item.label}
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
