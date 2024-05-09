import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  DraggableProvidedDragHandleProps,
  DraggableStateSnapshot,
  DropResult,
  Droppable
} from '@hello-pangea/dnd';
import { Box, Button, CircularProgress, Dialog, IconButton, ListItem, ListItemIcon, ListItemText, Typography } from '@material-ui/core';
import { DragHandle, DragIndicator, ExpandMore } from '@material-ui/icons';
import React, { useCallback, useContext, useEffect } from 'react';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, changeItemIndex, reorder } from './../../constants/helpers';

const ArrangeView = (props) => {
  const { open, close, resourceData: gridData } = props;
  const [nonSection, setNonSection] = React.useState([]);
  const [hasChanged, setHasChanged] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState([]);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    const itemsWithSection = gridData.filter((d: any) => d.section);

    const newData = [];

    itemsWithSection?.forEach((element, i) => {
      const index = newData.findIndex((d) => d.section === element.section);
      const newElement = {
        ...element,
        id: `${element.resource}`
      };
      if (index !== -1) {
        newData[index].subItems.push(newElement);
      } else {
        newData.push({
          id: `${element.section}`,
          section: element.section,
          subItems: [newElement]
        });
      }
    });

    setData(newData);

    setNonSection(gridData.filter((d: any) => !d.section));
  }, [gridData]);

  const handleSaveChanges = async () => {
    setLoading(true);
    let newData = [];
    nonSection.forEach((d) => newData.push(d));
    let fileData: any;
    data.forEach((d) => newData.push(...d.subItems));

    fileData = newData.map((d, indx) => ({
      resource: d.resource,
      order: indx,
      sectionName: d.section
    }));

    axiosInstance()
      .put(`/sa-formbuilder/resource/form-builder/update-order`, fileData)
      .then(() => {
        setLoading(false);
        close();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Saved Successfully'
        });
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: err
        });
      });
  };

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      console.log(result);
      if (!result.destination) {
        return;
      }
      setHasChanged(true);
      const sourceIndex = result.source.index;
      const destIndex = result.destination.index;

      if (result.type === 'section') {
        setData(reorder(data, sourceIndex, destIndex));
      } else if (result.type === 'item') {
        const itemSubItemMap = data.reduce((acc, item) => {
          acc[item.id] = item.subItems;
          return acc;
        }, {});
        const sourceParentId = result.source.droppableId;
        const destParentId = result.destination.droppableId;

        const sourceSubItems = itemSubItemMap[sourceParentId];
        const destSubItems = itemSubItemMap[destParentId];

        let newItems = [...data];
        const item = sourceSubItems[sourceIndex];

        /** In this case subItems are reOrdered inside same Parent */
        if (sourceParentId === destParentId) {
          const reorderedSubItems = changeItemIndex(sourceSubItems, item, sourceIndex, destIndex);
          newItems = newItems.map((item) => {
            if (item.id === sourceParentId) {
              item.subItems = reorderedSubItems;
            }
            return item;
          });
          setData(newItems);
        } else {
          let newSourceSubItems = [...sourceSubItems];
          newSourceSubItems.splice(sourceIndex, 1);

          let newDestSubItems = [...destSubItems];
          newDestSubItems.splice(destIndex, 0, { ...item, section: result.destination.droppableId });
          newItems = newItems.map((item) => {
            if (item.id === sourceParentId) {
              item.subItems = newSourceSubItems;
            } else if (item.id === destParentId) {
              item.subItems = newDestSubItems;
            }
            return item;
          });
          setData(newItems);
        }
      }
    },
    [data]
  );

  return (
    <Dialog
      maxWidth="xs"
      fullScreen={true}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={open}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          close();
        }
      }}
      fullWidth
    >
      <CustomDialogHeader title={`Change Resource Order`} onClose={close} showRequiredLabel={false} showManimizeMaximize={false} />
      <CustomDialogContent>
        <Box my={1}>
          <span>Drag & Drop to arrange</span>
        </Box>
        <br />
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="droppable" type="section">
            {(provided, snapshot) => (
              <ul ref={provided.innerRef} {...provided.droppableProps} className="list-none space-y-2">
                {data?.map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? ' bg-[var(--dark-secondary,#ebebeb)]' : ''} transition-colors`}
                      >
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />} aria-controls={`section-${index}-content`} id={`section-${index}-header`}>
                            <IconButton size="small" {...provided.dragHandleProps}>
                              <DragIndicator />
                            </IconButton>
                            <Typography variant="subtitle1">{section.section}</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <RenderSubItems section={section} />
                          </AccordionDetails>
                        </Accordion>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" color="primary" onClick={close}>
          Close
        </Button>
        <Button
          variant="contained"
          color="primary"
          disableElevation
          disabled={!hasChanged ? true : hasChanged && loading ? true : false}
          onClick={() => {
            handleSaveChanges();
          }}
        >
          {loading && <CircularProgress size={25} />}
          {!loading && 'Save changes'}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

interface ItemProps {
  sectionData: any;
  dragHandleProps: DraggableProvidedDragHandleProps;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}

const RenderSubItems = ({ section }) => {
  return (
    <Droppable droppableId={section.section} type={`item`}>
      {(provided, snapshot) => (
        <ul
          className={`list-none ${snapshot.isDraggingOver ? 'bg-blue-100 dark:bg-[var(--dark-primary)] ' : ''} rounded-md`}
          {...provided.droppableProps}
          ref={provided.innerRef}
        >
          {section.subItems?.map((item, nestedIndex) => (
            <Draggable key={item.id} draggableId={`${item.id}`} index={nestedIndex}>
              {(provided, snapshot) => (
                <RenderListItems
                  provided={provided}
                  snapshot={snapshot}
                  key={item._id}
                  dragHandleProps={provided.dragHandleProps}
                  sectionData={item}
                />
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </ul>
      )}
    </Droppable>
  );
};

const RenderListItems = ({ sectionData, dragHandleProps, provided, snapshot }: ItemProps) => {
  return (
    <ListItem
      divider={true}
      {...provided.draggableProps}
      ref={provided.innerRef}
      className={`${
        snapshot.isDragging ? ' [border:1px_solid_var(--common-border-color)_!important] ' : ''
      } transition-colors rounded-md bg-[var(--dark-secondary,white)]`}
    >
      <ListItemIcon {...dragHandleProps}>
        <DragHandle />
      </ListItemIcon>
      <ListItemText primary={sectionData.resourceLabel} />
    </ListItem>
  );
};

export default ArrangeView;
