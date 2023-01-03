import { Box, IconButton, Typography } from '@material-ui/core';
import { Delete } from '@material-ui/icons';
import { useDrag, useDrop } from 'react-dnd';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

interface Item {
  id: string;
  originalIndex: number;
}

const style = {
  cursor: 'pointer'
};

const ItemView = ({ label, handleRemove, id, findCard, moveCard, formData }) => {
  const originalIndex = findCard(formData?._id ? formData?._id : formData?.name).index;
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'view',
      item: { id, originalIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      }),
      end: (item, monitor) => {
        const { id: droppedId, originalIndex } = item;
        const didDrop = monitor.didDrop();
        if (!didDrop) {
          moveCard(droppedId, originalIndex);
        }
      }
    }),
    [id, originalIndex, moveCard]
  );

  const opacity = isDragging ? 0.4 : 1;

  const [, drop] = useDrop(
    () => ({
      accept: 'view',
      hover({ id: draggedId }: Item) {
        if (draggedId !== id) {
          const { index: overIndex } = findCard(id);
          moveCard(draggedId, overIndex);
        }
      }
    }),
    [findCard, moveCard]
  );

  return (
    <div style={{ ...style, opacity }} ref={(node) => drag(drop(node))}>
      <Box bgcolor={'white'} m={2} border={1} p={2} borderColor="grey.300" className="text-truncate">
        <Typography variant="body1" className="text-truncate">
          {label}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <HtmlTooltip title="Delete">
            <IconButton onClick={() => handleRemove(id)} style={{ display: 'flex', justifyContent: 'flex-end' }} size="small">
              <Delete color="error" />
            </IconButton>
          </HtmlTooltip>
        </Box>
      </Box>
    </div>
  );
};

export default ItemView;
