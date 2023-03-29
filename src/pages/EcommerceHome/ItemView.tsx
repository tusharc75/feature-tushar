import { Box, Grid, IconButton, makeStyles, Paper, ThemeOptions, Typography } from '@material-ui/core';
import { Delete, Edit } from '@material-ui/icons';
import { useDrag, useDrop } from 'react-dnd';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useState } from 'react';
import ConfigureItemDialog from './ConfigureItemDialog';
interface Item {
  id: string;
  originalIndex: number;
}

const ItemView = ({ itemData, label, handleRemove, id, findCard, moveCard, setFormData }) => {
  const originalIndex = findCard(itemData?._id).index;

  const [editDialog, setEditDialog] = useState(false);
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
    <Grid ref={(node) => drag(drop(node))} item xs={6} sm={itemData?.column} md={itemData?.column}>
      <Paper>
        <Box p={2}>
          <Typography variant="body1" style={{ fontWeight: 500 }} className="text-truncate">
            {label}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <HtmlTooltip title="Edit">
              <IconButton
                onClick={() => {
                  setEditDialog(true);
                }}
                style={{ display: 'flex', justifyContent: 'flex-end' }}
                size="small"
              >
                <Edit color="primary" />
              </IconButton>
            </HtmlTooltip>
            <HtmlTooltip title="Delete">
              <IconButton onClick={() => handleRemove(id)} style={{ display: 'flex', justifyContent: 'flex-end' }} size="small">
                <Delete color="error" />
              </IconButton>
            </HtmlTooltip>
          </Box>
        </Box>
      </Paper>
      {editDialog && (
        <ConfigureItemDialog
          open={editDialog}
          onClose={() => {
            setEditDialog(false);
          }}
          itemData={itemData}
          setFormData={setFormData}
        />
      )}
    </Grid>
  );
};

export default ItemView;
