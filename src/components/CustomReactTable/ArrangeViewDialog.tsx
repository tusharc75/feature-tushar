import React, { useEffect } from 'react';
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
  Switch,
  Button,
  Box,
  TextField,
  Typography,
  Checkbox
} from '@material-ui/core';
import { DragHandle } from '@material-ui/icons';
import { XYCoord } from 'dnd-core';
import { DndProvider, useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import { isEqual } from 'lodash';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxHeight: 400,
      backgroundColor: theme.palette.background.paper
    },
    cursor: {
      cursor: 'move'
    }
  })
);

interface ArrangeColumnsProps {
  onClose: VoidFunction;
  columns: any[];
  setColumns?: any;
  columnApi: any;
  isClientSideGrid: boolean;
  saveColumnOptions: boolean;
  updateGridHiddenColumns: any;
  renderedFrom: string;
  setHiddenColumns?: any;
  getToggleHideAllColumnsProps?: any;
  setColumnOrder?: any;
}

const ItemTypes = {
  CARD: 'card'
};


const ArrangeViewDialog = (props: ArrangeColumnsProps) => {
  const {
    onClose,
    columns,
    setColumns,
    columnApi,
    isClientSideGrid,
    updateGridHiddenColumns,
    renderedFrom,
    saveColumnOptions,
    setHiddenColumns,
    getToggleHideAllColumnsProps,
    setColumnOrder
  } = props;

  const classes = useStyles();
  const [sortedColumns, setSortedColumns] = React.useState([]);
  const [searchedColumns, setSearchedColumns] = React.useState([]);
  const [searchVal, setSearchVal] = React.useState('');
  const [oldData, setOldData] = React.useState([]);
  const [allChecked, setAllChecked] = React.useState(true);
  const [isMinimized, setMinimized] = React.useState(true);

  React.useEffect(() => {
    setSortedColumns([...columns]);
    setOldData([...columns].map(d => {
      return { [d.id]: d.isVisible }
    }));
  }, []);

  useEffect(() => {
    const tempColumns = sortedColumns?.length > 0 ? sortedColumns : [...columns];
    if (tempColumns?.some(s => s.sticky === undefined && !s.isVisible)) {
      setAllChecked(false)
    } else {
      setAllChecked(true)
    }

  }, [sortedColumns])



  const handleToggle = (column: any, event: React.ChangeEvent<HTMLInputElement>) => {
    const newColumns = [...sortedColumns];
    const getFieldIndex = sortedColumns.findIndex((d) => d.id === column.id);
    newColumns[getFieldIndex].isVisible = event.target.checked;
    setSortedColumns(newColumns);
  };

  const handleToggleAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColumns = [...sortedColumns];
    newColumns?.forEach((e: any) => {
      if (!e.disabled && !e.primaryField && !e.sticky) {
        e.isVisible = event.target.checked;
      }
    });
    setAllChecked(event.target.checked);
  };

  const handleSaveChange = () => {
    let dataToStore = [];
    sortedColumns.forEach((f) => {
      let object = {};
      Object.keys(f).forEach((ff) => {
        if (typeof f[ff] !== "function" && typeof f[ff] !== "object") {
          object[ff] = f[ff];
        }
      })
      dataToStore.push(object);
    })

    if (renderedFrom && renderedFrom !== '') {
      let hidedColumns = dataToStore?.filter((o) => !o?.isVisible && !['expander', 'selection', 'action']?.includes(o?.id)).map((o) => o?.id);
      updateGridHiddenColumns(hidedColumns);
    }

    setColumnOrder([...sortedColumns.map(m => m.id)])
    setHiddenColumns([...sortedColumns].filter(f => f.sticky === undefined && f.isVisible === false).map(m => m.id))
    onClose();
  };

  const resetColumnOrder = () => {
    if (renderedFrom && renderedFrom !== '') {
      updateGridHiddenColumns([]);
    }
    setColumnOrder([...columns.map(m => m.id)])
    setHiddenColumns([])
    onClose()
  }

  const moveItem = React.useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragCard = sortedColumns[dragIndex];
      const columnsForGrid = update(sortedColumns, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragCard]
        ]
      });

      setSortedColumns([...columnsForGrid]);
    },
    [sortedColumns]
  );

  useEffect(() => {
    if (!searchVal) return;
    const matchedColumns = sortedColumns.filter((col) => {
      const fieldName = typeof col.Header === "string" ? col.Header.toLowerCase() : "";
      return fieldName.includes(searchVal.toLowerCase());
    });
    setSearchedColumns(matchedColumns);
  }, [searchVal]);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth fullScreen={!isMinimized}>
      <CustomDialogHeader
        title="Arrange View"
        onClose={onClose}
        showRequiredLabel={false}
        showManimizeMaximize={true}
        isMinimized={isMinimized}
        onMinimizeMaximize={() => setMinimized((prevState) => !prevState)}
      />
      <CustomDialogContent>
        <List
          disablePadding
          subheader={
            <Box display="flex" alignItems="center">
              <ListSubheader style={{ width: '50%' }} disableGutters disableSticky>
                Toggle and Drag & Drop to arrange
              </ListSubheader>
              <TextField
                type='search'
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                size="small"
                style={{ width: '50%', marginLeft: '1rem' }}
                variant="outlined"
                placeholder="Search"
              />
            </Box>
          }
          className={classes.root}
        >
          {
            !searchVal &&
            <ListItem disableGutters dense>
              <ListItemText primary="Column Name" />
              <ListItemSecondaryAction>
                <ListItemText primary="Toggle (hide/show)" />
              </ListItemSecondaryAction>
            </ListItem>
          }
          {
            !searchVal &&
            <ListItem disableGutters>
              <ListItemText primary="All Columns" />
              <ListItemSecondaryAction>
                {
                  setHiddenColumns ? <Switch size="small" checked={allChecked} onChange={handleToggleAll} /> :
                    (getToggleHideAllColumnsProps ? <Switch size="small" {...getToggleHideAllColumnsProps()} /> : "")

                }
              </ListItemSecondaryAction>
            </ListItem>
          }

          {/* {lockedItem.map((col) => (
            <ListItem divider disableGutters disabled={col?.disabled} key={col.field}>
              <ListItemText primary={col?.headerName} />
              <ListItemSecondaryAction>
                <Switch size="small" disabled={col?.disabled} checked={col?.isVisible} onChange={handleToggle(col)} />
              </ListItemSecondaryAction>
            </ListItem>
          ))} */}
          {!searchVal ? (
            <DndProvider backend={HTML5Backend}>
              {sortedColumns.map((column, index) => (
                <RenderListItem
                  key={column.id}
                  column={column}
                  handleToggle={handleToggle}
                  moveItem={moveItem}
                  index={index}
                  id={column.id}
                  columns={sortedColumns}
                />
              ))}
            </DndProvider>
          ) : searchedColumns.length > 0 ? (
            searchedColumns.map((column, index) => (
              <ListItem key={`${column.id}-${index}`} divider disableGutters disabled={column.disabled} className={column.sticky ? "d-none" : ""}>
                <ListItemText id="switch-list-column" primary={column.Header} />
                <ListItemSecondaryAction >
                  {column.sticky ? "" : <Switch size="small" checked={column.isVisible} onChange={(e) => {
                    handleToggle(column, e)
                  }} />}
                </ListItemSecondaryAction>
              </ListItem>
            ))
          ) : (
            <Box my={5}>
              <Typography align="center">No results found!</Typography>
            </Box>
          )}
        </List>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button variant="outlined" color="primary" onClick={onClose}>
          Close
        </Button>
        <Button variant="outlined" color="primary" onClick={resetColumnOrder}>
          Reset
        </Button>
        <Button variant="contained" color="primary" disableElevation
          disabled={isEqual(oldData, sortedColumns.map(d => {
            return { [d.id]: d.isVisible }
          }))}
          onClick={handleSaveChange}>
          Save changes
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

interface ItemProps {
  column: any;
  moveItem: CallableFunction;
  handleToggle: any;
  id: string;
  index: number;
  columns: any[];
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const RenderListItem = (props: ItemProps) => {
  const { column, handleToggle, moveItem, id, index, columns } = props;
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
      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    }
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: () => {
      return { id, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    })
  });

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));

  return column.sticky ? <div className="d-none" /> :
    <div ref={ref} style={{ opacity }} data-handler-id={handlerId}>
      <ListItem divider disableGutters disabled={column.disabled || column?.primaryField}>
        <ListItemIcon className={`${classes.cursor} pl-2`}>
          <DragHandle />
        </ListItemIcon>
        <ListItemText id={column.id} primary={column.Header} />
        <ListItemSecondaryAction>
          <Switch size="small" disabled={column.disabled || column?.primaryField} checked={column.isVisible} onChange={(e) => {
            handleToggle(column, e)
          }} />
        </ListItemSecondaryAction>
      </ListItem>
    </div>
};

export default ArrangeViewDialog;
