import { Box, Button, Card, CardActionArea, CardActions, CardContent, CardHeader, CardMedia, Grid, IconButton, makeStyles, Paper, ThemeOptions, Typography } from '@material-ui/core';
import { Delete, Edit } from '@material-ui/icons';
import { useDrag, useDrop } from 'react-dnd';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import { useContext, useState } from 'react';
import { imageUploadMaxSize } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import Carousel from "react-material-ui-carousel";
import ConfigureItemDialog from './ConfigureItemDialog';

const useClasses = makeStyles((theme: ThemeOptions) => ({
  paper: {
    padding: '16px',
    textAlign: 'center',
    color: theme.palette.text.secondary,
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'column',
    position: 'relative',

    '&:hover': {
      icons: {
        display: 'block'
      }
    }
  },
  title: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#555'
  },
  chartIcon: {
    fontSize: '120px'
  },
  media: {
    height: 200,
  },
}));
interface Item {
  id: string;
  originalIndex: number;
}

const style = {
  cursor: 'pointer'
};

const ItemView = ({ itemData, label, handleRemove, id, findCard, moveCard, formData, setFormData }) => {
  const originalIndex = findCard(itemData?._id ? itemData?._id : itemData?.name).index;
  const classes = useClasses();
  const { setToastConfig } = useContext(CustomToastContext);

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
    <>
      <Grid item xs={6} sm={itemData?.columnSize} md={itemData?.columnSize}>
        <Box bgcolor={'white'} m={2} border={1} p={2} borderColor="grey.300" className="text-truncate">
          <Typography variant="body1" className="text-truncate">
            {label}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <HtmlTooltip title="Edit">
              <IconButton onClick={() => { setEditDialog(true) }} style={{ display: 'flex', justifyContent: 'flex-end' }} size="small">
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
        {editDialog &&
          <ConfigureItemDialog
            open={editDialog}
            onClose={() => { setEditDialog(false) }}
            itemData={itemData}
            setFormData={setFormData}
          />}
      </Grid>
    </>
    // </div>

  );
};

export default ItemView;
