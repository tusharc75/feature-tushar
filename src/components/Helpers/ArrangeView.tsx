import { Box, Button, Dialog, Grid, Typography } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import { DragIndicator } from '@material-ui/icons';
import React, { useEffect } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { changeItemIndex, CustomDialogTransition } from 'src/constants/helpers';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDndSensors } from 'src/hooks';

const ArrangeView = ({ data, title, handleClose, handleSubmit, loading, isLast = true }) => {
  const [valid, setValid] = React.useState(false);
  const [fullScreen, setFullScreen] = React.useState(isMobile || isTablet);

  const [preRows, setPreRows] = React.useState([]);
  const [postRows, setPostRows] = React.useState([]);
  const [activeItem, setActiveItem] = React.useState(null);

  const buttonText = isLast ? 'Save' : 'Save and Next';

  useEffect(() => {
    setPreRows(data?.filter((e) => e.preWork)?.sort((a, b) => a.order - b.order));
    setPostRows(data?.filter((e) => !e.preWork)?.sort((a, b) => a.order - b.order));
  }, [data]);

  useEffect(() => {
    if (preRows?.find((x) => isNaN(x.order) || x.order <= 0 || x.order === undefined)) {
      setValid(false);
    } else {
      setValid(true);
    }
  }, [preRows]);

  useEffect(() => {
    if (postRows?.find((x) => isNaN(x.order) || x.order <= 0 || x.order === undefined)) {
      setValid(false);
    } else {
      setValid(true);
    }
  }, [postRows]);

  const onChangeValuePre = (index, field, value) => {
    let data = [...preRows];
    data[index][field] = value;
    setPreRows(data);
  };

  const moveItem = (event: DragEndEvent) => {
    setActiveItem(null);
    if (!event.over) return;
    const { active, over } = event;
    const dragIndex = active.data.current?.index;
    const dropIndex = over.data.current?.index;

    const itemType = active.data.current.type;

    if (active.id === over.id) return;

    if (itemType === 'arrangeViewPost') {
      const dragCard = postRows[dragIndex];

      let updatedIndexColumns = changeItemIndex(postRows, dragCard, dragIndex, dropIndex);
      updatedIndexColumns = updatedIndexColumns.map((n, i) => ({ ...n, order: i + 1 + preRows.length }));
      setPostRows(updatedIndexColumns);
    }
    if (itemType === 'arrangeViewPre') {
      const dragCard = preRows[dragIndex];
      let updatedIndexColumns = changeItemIndex(preRows, dragCard, dragIndex, dropIndex);
      updatedIndexColumns = updatedIndexColumns.map((n, i) => ({ ...n, order: i + 1 }));
      setPreRows(updatedIndexColumns);
    }
  };

  const onChangeValuePost = (index, field, value) => {
    let data = [...postRows];
    data[index][field] = value;
    setPostRows(data);
  };

  const onDragStart = (event: DragStartEvent) => {
    if (!event.active) return;
    setActiveItem(event.active.data.current.props);
  };

  const sensors = useDndSensors();

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
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
        onClose={handleClose}
      />
      <CustomDialogContent>
        <DndContext onDragEnd={moveItem} onDragStart={onDragStart} sensors={sensors}>
          {preRows?.length > 0 && (
            <Box mb={2} p={1} border={1} borderColor="var(--common-border-color)" bgcolor="var(--dark-secondary, white)">
              {postRows?.length > 0 ? (
                <Typography variant="subtitle2" gutterBottom>
                  Pre Work
                </Typography>
              ) : null}

              {preRows?.length && (
                <SortableContext items={preRows?.map((d) => d._id)}>
                  <ul className="list-none space-y-2">
                    {preRows?.map((column: any, index) => (
                      <RenderListItem key={column.field} column={column} type={'arrangeViewPre'} index={index} onChangeValue={onChangeValuePre} />
                    ))}
                  </ul>
                </SortableContext>
              )}
            </Box>
          )}
          {postRows?.length > 0 && (
            <Box mb={2} p={1} border={1} borderColor="var(--common-border-color)" bgcolor="var(--dark-secondary, white)">
              {preRows?.length > 0 ? (
                <Typography variant="subtitle2" gutterBottom>
                  Post Work
                </Typography>
              ) : null}

              {postRows?.length && (
                <SortableContext items={postRows?.map((d) => d._id)}>
                  <ul className="list-none space-y-2">
                    {postRows?.map((column: any, index) => (
                      <RenderListItem key={column.field} column={column} type={'arrangeViewPost'} index={index} onChangeValue={onChangeValuePost} />
                    ))}
                  </ul>
                </SortableContext>
              )}
            </Box>
          )}
          <DragOverlay>
            {activeItem && (
              <span className="[&_.MuiIconButton-root]:!cursor-grabbing">
                <RenderListItem {...activeItem} />
              </span>
            )}
          </DragOverlay>
        </DndContext>
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
            handleSubmit([...preRows, ...postRows]);
          }}
          disabled={loading || !valid}
        >
          {buttonText}
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

const RenderListItem = ({ column, index, onChangeValue, type }) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column._id,
    data: {
      type,
      index,
      props: { column, index, onChangeValue }
    },
    disabled: column.disabled
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  return (
    <li
      style={style}
      ref={setNodeRef}
      className={`${
        isDragging ? ' bg-[var(--dark-secondary,theme("colors.blue.200"))]' : 'bg-[var(--dark-secondary,#fff)]'
      } list-none transition-colors`}
    >
      <Box bgcolor="var(--dark-primary, white)" border={1} p={1} borderColor="var(--common-border-color)">
        <Grid container spacing={1}>
          <Grid item xs={1}>
            <Box pt={1}>
              <IconButton size="small" {...attributes} {...listeners} className=" drag-handle !cursor-grab">
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
    </li>
  );
};

export default ArrangeView;
