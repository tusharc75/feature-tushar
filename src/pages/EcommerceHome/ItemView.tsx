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

const useClasses = makeStyles((theme: ThemeOptions) => ({
  paper: {
    padding: '16px',
    textAlign: 'center',
    color: theme.palette.text.secondary,
    width: '100%',
    minHeight: '250px',
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

  const [isImgUploading, setImgUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [image, setImage] = useState<any>("");
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

  const handleUploadImage = (event) => {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[0];

      //  1048576 = 1 MB
      if (file.size > imageUploadMaxSize.size) {
        setToastConfig({
          open: true,
          type: 'error',
          message: `Image must be less than ${imageUploadMaxSize.text} size`
        });
      } else {
        getImageUrl(file);
      }

      event.target.value = '';
    }
  };

  const getImageUrl = (file) => {
    setImageUploadProgress(0);
    let formData = new FormData();
    formData.append('file', file);
    setImgUploading(true);

    axiosInstance()
      .post('/user/upload-public', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (pE) => {
          const completedPercent = Math.floor((pE.loaded * 100) / pE.total);
          setImageUploadProgress(completedPercent);
          if (completedPercent === 100) {
            setTimeout(() => {
              setImageUploadProgress(0);

            }, 4000);
          }
        }
      })
      .then(({ data }) => {
        if (itemData?.name?.includes("imageSlider")) {
          setFormData((prevState) => {
            prevState.find((i) => (i._id ? i._id === itemData?._id : i.name === itemData?.name))["images"] = prevState.find((i) => (i._id ? i._id === itemData?._id : i.name === itemData?.name))["images"] ? [...prevState.find((i) => (i._id ? i._id === itemData?._id : i.name === itemData?.name))["images"], data.fileUrl] : [data.fileUrl]
            return prevState;
          })
        } else {
          setFormData((prevState) => {
            prevState.find((i) => (i._id ? i._id === itemData?._id : i.name === itemData?.name))["image"] = data.fileUrl
            return prevState;
          })
        }

        setImgUploading(false);
      })
      .catch((err) => {
        setImgUploading(false);
        setToastConfig(err);
        setImageUploadProgress(0);
      });
  };

  return (
    <Grid style={{ ...style, opacity }} ref={(node) => drag(drop(node))} item xs={itemData?.columnSize}>

      <Card className={classes.paper}>
        <CardHeader
          title={label}
        />
        <CardActionArea>
          {itemData?.name?.includes("imageSlider") ?
            <>
              <CardMedia  children={<Carousel
                strictIndexing
                animation="slide"
                autoPlay={false}
                index={0}
                navButtonsAlwaysVisible
              >
                {itemData?.images && itemData?.images?.map((item: any, i) => (
                  <div className={classes.media} key={i} >
                    <img src={item} alt={item} />
                  </div>
                ))}
              </Carousel>} />
            </>
            : <CardMedia
              className={classes.media}
              image={itemData?.image}
              title={itemData?.image}
            />}
        </CardActionArea>
        <CardActions>
          <label htmlFor={itemData?.name}>
            <IconButton title="Add picture" color="primary" size="small" aria-label="upload picture" component="span">
              <AddCircleIcon />
              <input
                onClick={(e: any) => (e.target.value = null)}
                id={itemData?.name}
                name={itemData?.name}
                onChange={handleUploadImage}
                accept="image/x-png,image/gif,image/jpeg"
                style={{
                  opacity: '0',
                  position: 'absolute',
                  zIndex: -1
                }}
                type="file"
              />
            </IconButton>
          </label>
          {(itemData?.image || itemData?.images) && <IconButton
            title="Remove picture"
            className={"errorColor"}
            size="small"
            aria-label="delete picture"
            component="span"
            onClick={() => {
              if (itemData?.name?.includes("imageSlider")) {
                setFormData((prevState) => {
                  prevState.find((i) => (i._id ? i._id === itemData?._id : i.name === itemData?.name))["images"] = []
                  return prevState;
                })
              } else {
                setFormData((prevState) => {
                  prevState.find((i) => (i._id ? i._id === itemData?._id : i.name === itemData?.name))["image"] = ""
                  return prevState;
                })
              }
             }}
          >
            <DeleteIcon />
          </IconButton>}
          <IconButton size="small"  onClick={() => handleRemove(id)}>
            <Delete color="error" />
          </IconButton>
        </CardActions>
      </Card>
      {/* <Paper className={classes.paper}
      // style={{ backgroundColor: isEditing ? '#dedede' : 'white' }}
      >
        <Typography variant="body1" className="text-truncate">
          {label}
        </Typography>
        <Box display={'flex'} justifyContent="space-between">
          
          <label htmlFor={itemData?.image ?? "image"}>
            <IconButton title="Add picture" color="primary" size="small" aria-label="upload picture" component="span">
              <AddCircleIcon />
              <input
                onClick={(e: any) => (e.target.value = null)}
                id={itemData?.image ?? "image"}
                name={itemData?.image ?? "image"}
                onChange={handleUploadImage}
                accept="image/x-png,image/gif,image/jpeg"
                style={{
                  opacity: '0',
                  position: 'absolute',
                  zIndex: -1
                }}
                type="file"
              />
            </IconButton>
          </label>
          {itemData?.image && <IconButton
            title="Remove picture"
            className={"errorColor"}
            size="small"
            aria-label="delete picture"
            component="span"
            onClick={() => { }}
          >
            <DeleteIcon />
          </IconButton>}
          <IconButton size="small" onClick={() => handleRemove(id)}>
            <Delete color="error" />
          </IconButton>
        </Box>
      </Paper> */}
      {/* <Box bgcolor={'white'} m={2} border={1} p={2} borderColor="grey.300" className="text-truncate">
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
      </Box> */}
    </Grid>

  );
};

export default ItemView;
