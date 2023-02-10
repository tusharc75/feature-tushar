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

// const IndeterminateCheckbox = React.forwardRef(
//   ({ indeterminate, ...rest }: any, ref) => {
//     const defaultRef = React.useRef()
//     const resolvedRef: any = ref || defaultRef

//     React.useEffect(() => {
//       resolvedRef.current.indeterminate = indeterminate
//     }, [resolvedRef, indeterminate])

//     return <Switch size="small" ref={resolvedRef} {...rest} />
//     // return <input type="checkbox" ref={resolvedRef} {...rest} />
//   }
// )

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
  const [oldData, setOldData] = React.useState('');
  const [newData, setNewData] = React.useState('');
  const [allChecked, setAllChecked] = React.useState(true);
  const [hasChanged, setHasChanged] = React.useState(false);
  const [isMinimized, setMinimized] = React.useState(true);

  const [lockedItem, setLockedItem] = React.useState([]);

  React.useEffect(() => {
    //   if (!columnApi) return;
    //   let newCols = new Array();

    //   let gridLayedCols = columnApi.getAllGridColumns();
    //   gridLayedCols = gridLayedCols.filter((col) => col.pinned === null);

    //   let layedCols = gridLayedCols.map((col: any) => col.colId);

    //   columns.forEach((col) => {
    //     const index = layedCols.indexOf(col.field);
    //     if (index > -1) {
    //       const _col = gridLayedCols.find((_c) => _c.colId === col.field);
    //       col = { ...col, isVisible: _col ? _col.isVisible : col.isVisible };

    //       newCols[index] = col;
    //     }
    //     if (col.hasOwnProperty('pivotIndex') || (col.hasOwnProperty('lockPosition') && col.lockPosition)) {  
    //       setLockedItem((prevState) => [...prevState, col]);
    //     }
    //   });

    //   newCols = newCols.filter((item) => item);
    // setSortedColumns([...columns.filter(f => typeof f.Header === "string" && f.Header)]);

    try {
      const storedColumns = localStorage.getItem(renderedFrom)
      if (storedColumns) {
        const latestColumns = [...JSON.parse(storedColumns)];
        setSortedColumns(latestColumns);

        if (latestColumns.filter(f => f.sticky === undefined).some(s => s.isVisible === false)) {
          setAllChecked(false)
        }

      } else {
        setSortedColumns([...columns]);
      }
    } catch (ex) {
      setSortedColumns([...columns]);
      console.error(`Error while getting stored data from local storage - ${renderedFrom}`)
    }



    // setColumns([...columns]);
    // setOldData(JSON.stringify([...columns]));
    // setNewData(JSON.stringify([...columns]));
  }, []);

  // React.useEffect(() => {
  //   if (oldData === newData) {
  //     setHasChanged(false);
  //   } else {
  //     setHasChanged(true);
  //   }

  //   const allColumnShow = sortedColumns.filter((col) => col.isVisible === false).length === 0;
  //   setAllChecked(allColumnShow);
  // }, [oldData, newData, sortedColumns]);

  const handleToggle = (column: any, event: React.ChangeEvent<HTMLInputElement>) => {
    const newColumns = [...sortedColumns];
    const getFieldIndex = sortedColumns.findIndex((d) => d.id === column.id);
    newColumns[getFieldIndex].isVisible = event.target.checked;

    setSortedColumns(newColumns);
    // setNewData(JSON.stringify(newColumns));
  };

  const handleToggleAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColumns = [...sortedColumns];
    newColumns?.forEach((e: any) => {
      if (!e.disabled && !e.primaryField) {
        e.isVisible = event.target.checked;
      }
    });
    // setSortedColumns(newColumns);
    setAllChecked(event.target.checked);

    // setHiddenColumns(event.target.checked ? [] : [...newColumns.map(m => m.id)])

    // setNewData(JSON.stringify(newColumns));
  };

  const handleSaveChange = () => {
    // const newColumns = [...sortedColumns];
    // newColumns.splice(lockedItem.index, 0, lockedItem.column);
    // setColumns(newColumns);
    // const colIds = newColumns.map((col) => col.field);
    // const oldColumnState = columnApi.getColumnState();
    // let newColumnsState = new Array();

    // for (const d of oldColumnState) {
    //   const index = colIds.indexOf(d.colId);
    //   newColumnsState.splice(index, 0, { ...d });
    // }
    // columnApi.setColumnState(newColumnsState);

    // const hiddenColumns = newColumns.filter((d) => !d.isVisible).map((m) => m.field);
    // const nonHiddenColumns = newColumns.filter((d) => d.isVisible).map((m) => m.field);
    // columnApi.setColumnsVisible(hiddenColumns, false);
    // columnApi.setColumnsVisible(nonHiddenColumns, true);

    // if (!isClientSideGrid || saveColumnOptions) {
    //   let tempColumnState = columnApi.getColumnState();
    //   let hidedColumns = tempColumnState.filter((o) => o?.hide).map((o) => o?.colId);
    //   updateGridHiddenColumns(hidedColumns);
    // }


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

    const columnState = JSON.stringify([...dataToStore]);
    localStorage.setItem(renderedFrom, columnState);

    setColumnOrder([...sortedColumns.map(m => m.id)])
    setHiddenColumns([...sortedColumns].filter(f => f.sticky === undefined && f.isVisible === false).map(m => m.id))

    onClose();
  };

  /**
   *
   *  Drag'n'Drop function
   *
   */
  const moveItem = React.useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragCard = sortedColumns[dragIndex];
      // const updatedIndexColumns = update(sortedColumns, {
      //   $splice: [
      //     [dragIndex, 1],
      //     [hoverIndex, 0, dragCard]
      //   ]
      // });

      // setColumnOrder([...updatedIndexColumns.map(m => m.id)])

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
        <Button variant="contained" color="primary" disableElevation onClick={handleSaveChange}>
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
