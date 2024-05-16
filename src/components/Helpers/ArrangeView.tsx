import { Box, Button, Dialog, Grid, Typography } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import { DragIndicator } from '@material-ui/icons';
import update from 'immutability-helper';
import React, { useEffect } from 'react';
import { DragDropContext, Draggable, DropResult, Droppable } from '@hello-pangea/dnd';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { changeItemIndex } from 'src/constants/helpers';

const ArrangeView = ({ data, title, handleClose, handleSubmit, loading, isLast = true }) => {
  const [valid, setValid] = React.useState(false);
  const [fullScreen, setFullScreen] = React.useState(isMobile || isTablet);

  const [preRows, setPreRows] = React.useState([]);
  const [postRows, setPostRows] = React.useState([]);

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

  const moveItem = React.useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const { destination, source } = result;
      const dragIndex = source.index;
      const dropIndex = destination?.index;

      if (destination.droppableId !== source.droppableId) return;

      if (source.droppableId === 'arrangeViewPost') {
        const dragCard = postRows[dragIndex];
        let updatedIndexColumns = changeItemIndex(postRows, dragCard, dragIndex, dropIndex);
        updatedIndexColumns = updatedIndexColumns.map((n, i) => ({ ...n, order: i + 1 + preRows.length }));
        setPostRows(updatedIndexColumns);
      }
      if (source.droppableId === 'arrangeViewPre') {
        const dragCard = preRows[dragIndex];
        let updatedIndexColumns = changeItemIndex(preRows, dragCard, dragIndex, dropIndex);
        updatedIndexColumns = updatedIndexColumns.map((n, i) => ({ ...n, order: i + 1 }));
        setPreRows(updatedIndexColumns);
      }
    },
    [postRows, preRows]
  );

  const onChangeValuePost = (index, field, value) => {
    let data = [...postRows];
    data[index][field] = value;
    setPostRows(data);
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
        onClose={handleClose}
      />
      <CustomDialogContent>
        {' '}
        <DragDropContext onDragEnd={moveItem}>
          {preRows?.length > 0 && (
            <Box mb={2} p={1} border={1} borderColor="var(--common-border-color)" bgcolor="var(--dark-secondary, white)">
              {postRows?.length > 0 ? (
                <Typography variant="subtitle2" gutterBottom>
                  Pre Work
                </Typography>
              ) : null}

              {preRows?.length && (
                <Droppable droppableId="arrangeViewPre">
                  {(provided) => (
                    <ul className="list-none" {...provided.droppableProps} ref={provided.innerRef}>
                      {preRows?.map((column: any, index) => (
                        <Draggable key={column._id || column.field} draggableId={column._id || column.field} index={index}>
                          {(provided, snapshot) => (
                            <li
                              {...provided.draggableProps}
                              ref={provided.innerRef}
                              className={`${snapshot.isDragging ? ' bg-[var(--dark-secondary,#ebebeb)]' : ''} transition-colors`}
                            >
                              <RenderListItem
                                key={column.field}
                                column={column}
                                index={index}
                                onChangeValue={onChangeValuePre}
                                dragHandleProps={provided.dragHandleProps}
                              />
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
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
                <Droppable droppableId="arrangeViewPost">
                  {(provided) => (
                    <ul className="list-none" {...provided.droppableProps} ref={provided.innerRef}>
                      {postRows?.map((column: any, index) => (
                        <Draggable key={column._id || column.field} draggableId={column._id || column.field} index={index}>
                          {(provided, snapshot) => (
                            <li
                              {...provided.draggableProps}
                              ref={provided.innerRef}
                              className={`${snapshot.isDragging ? ' bg-[var(--dark-secondary,#ebebeb)]' : ''} transition-colors`}
                            >
                              <RenderListItem
                                column={column}
                                index={index}
                                onChangeValue={onChangeValuePost}
                                dragHandleProps={provided.dragHandleProps}
                              />
                            </li>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              )}
            </Box>
          )}
        </DragDropContext>
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

const RenderListItem = ({ column, index, onChangeValue, dragHandleProps }) => {
  return (
    <div>
      <Box bgcolor="var(--dark-primary, white)" border={1} mb={1} p={1} borderColor="var(--common-border-color)">
        <Grid container spacing={1}>
          <Grid item xs={1}>
            <Box pt={1}>
              <IconButton size="small" {...dragHandleProps}>
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
    </div>
  );
};

export default ArrangeView;
