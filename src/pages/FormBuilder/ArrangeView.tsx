import React, { useEffect, useState, useContext } from 'react';
import { CustomDialogTransition } from './../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import {
  makeStyles,
  Theme,
  createStyles,
  Dialog,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  ListSubheader,
  Divider,
  Button,
  Paper,
  Box,
  CircularProgress,
  Typography
} from '@material-ui/core';
import { DragHandle } from '@material-ui/icons';
import { XYCoord } from 'dnd-core';
import { DndProvider, useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import update from 'immutability-helper';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { debounce, uniq } from 'lodash';

const ItemTypes = {
  CARD: 'card',
  SECTION: 'section'
};
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      // maxHeight: 400,
      backgroundColor: theme.palette.background.paper
    },
    cursor: {
      cursor: 'move'
    }
  })
);

const ArrangeView = (props) => {
  const { open, close, resourceData: gridData, brandId = null } = props;
  const [resourceData, setResourceData] = React.useState([]);
  const [nonSection, setNonSection] = React.useState([]);
  const [newData, setNewData] = React.useState('');
  const [newSection, setNewSection] = React.useState('');
  const [hasChanged, setHasChanged] = React.useState(false);
  const classes = useStyles();
  const [sections, setSections] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    let sectionsFileds = gridData.map((d: any) => d.section).filter((x: string) => x);

    setSections(uniq(sectionsFileds));
    setResourceData(gridData.filter((d: any) => d.section).map((d: any) => ({ ...d, id: d.name + ' ' + d.id })));
    setNonSection(gridData.filter((d: any) => !d.section));
  }, [gridData]);

  const getSection = (index: number) => resourceData.filter((d: any) => d.section === sections[index]);

  const moveItem = React.useCallback(
    (dragIndex: number, hoverIndex: number, section: string) => {
      // let sortCol = resourceData.filter((i) => {
      //   return i.section === section;
      // });
      // let sortColLeft = resourceData.filter((i) => {
      //   return i.section !== section;
      // });
      let dragCard = resourceData[dragIndex];

      const updatedIndexColumns = update(resourceData, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, { ...dragCard, section }]
        ]
      });
      // let newData = updatedIndexColumns.concat(sortColLeft);
      setResourceData(updatedIndexColumns);
      setNewData(JSON.stringify(newData));
    },
    [resourceData]
  );

  const handleSaveChanges = async () => {
    setLoading(true);

    let newData = [];
    sections.forEach((section) => {
      resourceData.forEach((d) => {
        if (section === d.section) {
          newData.push(d);
        }
      });
    });

    nonSection.forEach((d) => newData.push(d));

    let fileData: any;

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

  const moveSection = React.useCallback(
    debounce((dragIndex: number, hoverIndex: number) => {
      let dragCard = sections[dragIndex];
      let updatedIndexColumns = update(sections, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragCard]
        ]
      });
      setSections(updatedIndexColumns);
      setNewSection(JSON.stringify(updatedIndexColumns));
    }, 200),
    [sections]
  );

  React.useEffect(() => {
    if (newData) {
      setHasChanged(true);
    }
    if (newSection) {
      setHasChanged(true);
    }
  }, [newSection, newData, resourceData]);

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
        <Box my={1} color="#555">
          <h3>Drag & Drop to arrange</h3>
        </Box>
        <DndProvider backend={HTML5Backend}>
          {sections.map((section, sectionIndex) => (
            <SectionDrag
              isDivider={sections.length !== sectionIndex + 1}
              id={section}
              index={sectionIndex}
              key={section + ' - ' + sectionIndex}
              moveSection={moveSection}
            >
              <List disablePadding className={classes.root}>
                <Box paddingLeft={2} pt={1} color="#555">
                  <h3>{section}</h3>
                </Box>

                {getSection(sectionIndex).map((sectionData, index) => (
                  <RenderListItems
                    key={sectionData.name}
                    sectionData={sectionData}
                    moveItem={moveItem}
                    index={index}
                    id={sectionData.id}
                    section={section}
                    data={resourceData}
                    isDivider={getSection(sectionIndex).length !== index + 1}
                  />
                ))}
              </List>
            </SectionDrag>
          ))}
        </DndProvider>
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
  moveItem: CallableFunction;
  id: string;
  index: number;
  section: string;
  data?: any[];
  isDivider?: boolean;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}
const RenderListItems = (props: ItemProps) => {
  const { sectionData, moveItem, id, isDivider, section, data } = props;
  const classes = useStyles();

  const ref = React.useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.CARD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId()
      };
    },
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = data.findIndex((d) => d.id === id);
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveItem(dragIndex, hoverIndex, section, sectionData);
      item.index = hoverIndex;
    }
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: () => {
      return { id, index: data.findIndex((d: any) => d.id === id) };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging()
    })
  });

  const opacity = isDragging ? 0.6 : 1;
  drag(drop(ref));

  return (
    <div ref={ref} style={{ opacity }} data-handler-id={handlerId}>
      <ListItem>
        <ListItemIcon className={classes.cursor}>
          <DragHandle />
        </ListItemIcon>
        <ListItemText style={{ fontSize: '10px' }} primary={sectionData.resourceLabel} />
      </ListItem>
      {isDivider && <Divider />}
    </div>
  );
};

const SectionDrag = (props) => {
  const style = {
    cursor: 'move'
  };

  const { index, id, moveSection, isDivider } = props;
  const ref = React.useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.SECTION,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId()
      };
    },

    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveSection(dragIndex, hoverIndex);
      item.index = hoverIndex;
    }
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SECTION,
    item: () => {
      return { id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging()
    })
  });

  const opacity = isDragging ? 0.6 : 1;
  drag(drop(ref));

  return (
    <div ref={ref} style={{ opacity }} data-handler-id={handlerId}>
      <Paper style={{ ...style, opacity }} elevation={1}>
        {props.children}
      </Paper>
      {isDivider && (
        <Box my={2}>
          <Divider />
        </Box>
      )}
    </div>
  );
};

export default ArrangeView;
