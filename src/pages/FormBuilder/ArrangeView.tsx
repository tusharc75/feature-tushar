import { Box, Button, CircularProgress, Dialog, IconButton, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { DragHandle, DragIndicator, ExpandMore } from '@mui/icons-material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, changeItemIndex, generateId, reorder } from './../../constants/helpers';

import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDndSensors } from 'src/hooks';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

const ArrangeView = (props) => {
  const { open, close, resourceData: gridData } = props;
  const [nonSection, setNonSection] = React.useState([]);
  const [hasChanged, setHasChanged] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState([]);
  const toastConfig = useContext(CustomToastContext);
  const [activeItem, setActiveItem] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const itemsWithSection = gridData.filter((d: any) => d.section);

    const newData = [];

    itemsWithSection?.forEach((element, i) => {
      const index = newData.findIndex((d) => d.section === element.section);
      const newElement = {
        ...element,
        id: `${element.resource.split(' ').join('')}${generateId()}_${element._id}`
      };
      if (index !== -1) {
        newData[index].subItems.push(newElement);
      } else {
        newData.push({
          id: `${element.section.split(' ').join('')}${generateId()}`,
          section: element.section,
          subItems: [newElement]
        });
      }
    });

    setData(newData);

    setNonSection(gridData.filter((d: any) => !d.section));
  }, [open, gridData]);

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
    (event: DragEndEvent) => {
      setActiveSection(null);
      setActiveItem(null);
      if (!event.over || event.active.id === event.over.id) return;

      const { active, over } = event;
      setHasChanged(true);

      const sourceIndex = active.data.current.index;
      const destIndex = over.data.current.index;

      const sourceType = active.data.current.type;
      const destinationType = over.data.current.type;
      if (sourceType === 'Section' && destinationType === 'Section') {
        setData(reorder(data, sourceIndex, destIndex));
      }

      if (sourceType === 'Item' && destinationType === 'Item') {
        const activeSection = active.data.current.props.section;
        const overSection = over.data.current.props.section;
        const activeItemParent = activeSection.id;
        const overItemParent = overSection.id;
        const isInSameSection = activeItemParent === overItemParent;
        if (!isInSameSection) return;

        const sourceSubItems = activeSection.subItems;
        const item = sourceSubItems[sourceIndex];

        let newItems = [...data];
        const reorderedSubItems = changeItemIndex(sourceSubItems, item, sourceIndex, destIndex);
        newItems = newItems.map((item) => {
          if (item.id === activeItemParent) {
            item.subItems = reorderedSubItems;
          }
          return item;
        });
        setData(newItems);
      }
    },
    [data]
  );

  const onDragOver = (event: DragOverEvent) => {
    if (!event.over || event.active.id === event.over.id) return;

    const { active, over } = event;
    if (active.id === over.id) return;
    setHasChanged(true);
    const sourceType = active.data.current.type;
    const destinationType = over.data.current.type;
    if (sourceType === 'Item') {
      const activeSection = active.data.current.props.section;
      const overSection = over.data.current.props.section;

      const sourceSubItems = activeSection.subItems;
      const destSubItems = overSection.subItems;
      let newItems = [...data];

      if (destinationType === 'Item') {
        const activeItemParent = activeSection.id;
        const overItemParent = overSection.id;
        const overItemParentname = overSection.section;
        const isInSameSection = activeItemParent === overItemParent;
        if (isInSameSection) return;

        let newSourceSubItems = [...sourceSubItems];
        const [item] = newSourceSubItems.splice(active.data.current.index, 1);
        let newDestSubItems = [...destSubItems];
        newDestSubItems.splice(over.data.current.index, 0, { ...item, section: overItemParentname });
        newItems = newItems.map((item) => {
          if (item.id === activeItemParent) {
            item.subItems = newSourceSubItems;
          } else if (item.id === overItemParent) {
            item.subItems = newDestSubItems;
          }
          return item;
        });
        setData(newItems);
        // } else if (destinationType === 'Section') {
        //   const activeItemParent = activeSection.id;
        //   const overItemParent = over.data.current.props.section.id;
        //   const isInSameSection = activeItemParent === overItemParent;
        //   if (isInSameSection) return;

        //   let newSourceSubItems = [...sourceSubItems];
        //   const [item] = newSourceSubItems.splice(active.data.current.index, 1);
        //   let newDestSubItems = [...over.data.current.props.section.subItems];
        //   newDestSubItems.splice(newDestSubItems.length, 0, { ...item, section: overItemParent });
        //   newItems = newItems.map((item) => {
        //     if (item.id === activeItemParent) {
        //       item.subItems = newSourceSubItems;
        //     } else if (item.id === over.data.current.props.section.id) {
        //       item.subItems = newDestSubItems;
        //     }
        //     return item;
        //   });
        //   setData(newItems);
        // }
      }
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    if (!event || !event.active) return;
    const { active } = event;
    const sourceType = active.data.current?.type;
    const activeData = active.data.current?.props;

    if (sourceType === 'Section') {
      setActiveSection(activeData);
    } else if (sourceType === 'Item') {
      setActiveItem(activeData);
    }
  };

  const sensors = useDndSensors();

  const sectionIds = useMemo(() => data?.map((d) => d.id) || [], [data]);

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
        <div className="isolate z-50">
          {data && (
            <DndContext
              onDragEnd={handleDragEnd}
              onDragOver={onDragOver}
              onDragStart={onDragStart}
              sensors={sensors}
              modifiers={[restrictToVerticalAxis]}
            >
              <div role="list" className="grid list-none gap-2">
                <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
                  {data?.map((section, index) => <RenderSection section={section} index={index} key={section.id} />)}
                </SortableContext>
              </div>
              <DragOverlay>
                {activeItem && <RenderSubItems {...activeItem} />}
                {activeSection && <RenderSection {...activeSection} />}
              </DragOverlay>
            </DndContext>
          )}
        </div>
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

const RenderSection = ({ section, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: {
      type: 'Section',
      index,
      props: { section, index }
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  const subItemIds = useMemo(() => section.subItems.map((d) => d.id), [section.subItems]);

  return (
    <>
      <div
        role="listitem"
        ref={setNodeRef}
        style={style}
        className={`${isDragging ? ' [&_.MuiAccordionSummary-root]:!bg-[var(--dark-secondary,theme("colors.blue.200"))]' : ''} transition-colors`}
      >
        <Accordion TransitionProps={{ unmountOnExit: true }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <IconButton size="small" {...attributes} {...listeners} className={` !cursor-grab`}>
              <DragIndicator />
            </IconButton>
            <Typography variant="subtitle1">{section.section}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <SortableContext items={subItemIds} strategy={verticalListSortingStrategy}>
              <ul className={`list-none rounded-md`}>
                {section.subItems?.map((item, nestedIndex) => <RenderSubItems key={item.id} itemData={item} section={section} index={nestedIndex} />)}
              </ul>
            </SortableContext>
          </AccordionDetails>
        </Accordion>
      </div>
    </>
  );
};

interface ItemProps {
  itemData: any;
  index: number;
  section: any;
}
const RenderSubItems = ({ itemData, index, section }: ItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemData.id,
    data: { index: index, type: 'Item', props: { itemData, index, section } }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      //
      style={style}
    >
      <ListItem
        divider={true}
        className={`${
          isDragging ? 'bg-[var(--dark-primary,theme("colors.blue.200"))]' : ''
        } rounded-md bg-[var(--dark-secondary,white)] transition-colors`}
      >
        <ListItemIcon className={` cursor-grab`} {...attributes} {...listeners}>
          <DragHandle />
        </ListItemIcon>
        <ListItemText primary={itemData.resourceLabel} />
      </ListItem>
    </div>
  );
};

export default ArrangeView;
