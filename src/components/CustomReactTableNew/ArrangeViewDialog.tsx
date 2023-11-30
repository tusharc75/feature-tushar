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
import { startCase } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import { TouchBackend } from 'react-dnd-touch-backend';

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
  updateGridHiddenColumns: any;
  renderedFrom: string;
  setHiddenColumns?: any;
  getToggleHideAllColumnsProps?: any;
  setColumnOrder?: any;
  defaultColumns: any[];
}

const ItemTypes = {
  CARD: 'card'
};

const ArrangeViewDialog = (props: ArrangeColumnsProps) => {
  const {
    onClose,
    columns,
    updateGridHiddenColumns,
    renderedFrom,
    setHiddenColumns,
    getToggleHideAllColumnsProps,
    setColumnOrder,
    defaultColumns,
  } = props;

  const classes = useStyles();
  const [sortedColumns, setSortedColumns] = React.useState([]);
  const [searchedColumns, setSearchedColumns] = React.useState([]);
  const [searchVal, setSearchVal] = React.useState('');

  const [allChecked, setAllChecked] = React.useState(true);
  const [isMinimized, setMinimized] = React.useState(true);

  React.useEffect(() => {
    try {
      const data = localStorage.getItem('gridMetaData');
      const gridMetaData = JSON.parse(data || '{}');
      const hiddenCols = gridMetaData[renderedFrom]?.hide || [];
      const updatedCols = columns.map((col) => ({
        ...col,
        isVisible: !hiddenCols.includes(col.accessor)
      }));
      setSortedColumns(updatedCols);
    } catch (ex) {
      setSortedColumns([...columns]);
      console.error(`Error while getting stored data from local storage - ${renderedFrom}`);
    }
  }, []);

  useEffect(() => {
    const allShow = sortedColumns.filter((f) => f.sticky === undefined).some((s) => s.isVisible === false);
    setAllChecked(!allShow);
  }, [sortedColumns]);

  const handleToggle = (column: any, event: React.ChangeEvent<HTMLInputElement>) => {
    const newColumns = [...sortedColumns];
    const getFieldIndex = sortedColumns.findIndex((d) => d.accessor === column.accessor);
    newColumns[getFieldIndex].isVisible = event.target.checked;
    setSortedColumns(newColumns);
  };

  const handleToggleAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColumns = [...sortedColumns];
    newColumns?.forEach((e: any) => {
      if (!e.disabled) {
        e.isVisible = event.target.checked;
      }
    });
    setAllChecked(event.target.checked);
  };

  const handleReset = () => {
    if (renderedFrom && renderedFrom !== '') {
      updateGridHiddenColumns([], []);
    }
    setColumnOrder(defaultColumns?.map((col) => col?.accessor));
    setHiddenColumns([]);
    onClose();
  };

  const handleSaveChange = () => {
    let dataToStore = [];
    sortedColumns.forEach((f) => {
      let object = {};
      Object.keys(f).forEach((ff) => {
        if (typeof f[ff] !== 'function' && typeof f[ff] !== 'object') {
          object[ff] = f[ff];
        }
      });
      dataToStore.push(object);
    });
    if (renderedFrom && renderedFrom !== '') {
      const hidedColumns = dataToStore?.filter((o) => !o?.isVisible && !['expander', 'selection', 'action']?.includes(o?.accessor)).map((o) => o?.accessor);
      const columnOrder = dataToStore?.filter((o) => o?.sticky === undefined && !['expander', 'selection', 'action']?.includes(o?.accessor))?.map((o) => o?.accessor);
      updateGridHiddenColumns(hidedColumns, columnOrder);
    }
    setColumnOrder([...sortedColumns.map((m) => m.accessor)]);
    setHiddenColumns([...sortedColumns].filter((f) => f.sticky === undefined && f.isVisible === false).map((m) => m.accessor));
    onClose();
  };

  const moveItem = React.useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragCard = sortedColumns[dragIndex];
      const hoverCard = sortedColumns[hoverIndex];

      if (dragCard?.accessor === 'action' || dragCard?.accessor === 'selection' || dragCard?.lockPosition) return;
      if (hoverCard?.accessor === 'action' || hoverCard?.accessor === 'selection' || hoverCard?.lockPosition) return;

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
      const fieldName = typeof col.Header === 'string' ? col.Header.toLowerCase() : '';
      return fieldName.includes(searchVal.toLowerCase());
    });
    setSearchedColumns(matchedColumns);
  }, [searchVal]);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth fullScreen={!isMinimized || (isMobile && !isTablet)}>
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
            <Box className="flex items-center flex-wrap sm:gap-2">
              <ListSubheader disableGutters disableSticky>
                Toggle and Drag & Drop to arrange
              </ListSubheader>
              <div className="sm:ml-auto sm:w-1/2 w-full">
                <TextField
                  type="search"
                  fullWidth
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  size="small"
                  variant="outlined"
                  placeholder="Search"
                />
              </div>
            </Box>
          }
          className={classes.root}
        >
          {!searchVal && (
            <ListItem disableGutters dense>
              <ListItemText primary="Column Name" />
              <ListItemSecondaryAction>
                <ListItemText primary="Toggle (hide/show)" />
              </ListItemSecondaryAction>
            </ListItem>
          )}
          {!searchVal && (
            <ListItem disableGutters>
              <ListItemText primary="All Columns" />
              <ListItemSecondaryAction>
                {setHiddenColumns ? (
                  <Switch size="small" checked={allChecked} onChange={handleToggleAll} />
                ) : getToggleHideAllColumnsProps ? (
                  <Switch size="small" {...getToggleHideAllColumnsProps()} />
                ) : (
                  ''
                )}
              </ListItemSecondaryAction>
            </ListItem>
          )}

          {!searchVal ? (
            <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
              {sortedColumns.map(
                (column, index) =>
                  column?.accessor !== 'selection' &&
                  column?.accessor !== 'expander' && (
                    <RenderListItem
                      key={column.accessor}
                      column={column}
                      handleToggle={handleToggle}
                      moveItem={moveItem}
                      index={index}
                      accessor={column.accessor}
                      columns={sortedColumns}
                    />
                  )
              )}
            </DndProvider>
          ) : searchedColumns.length > 0 ? (
            searchedColumns.map(
              (column, index) =>
                column?.accessor !== 'selection' &&
                column?.accessor !== 'expander' && (
                  <ListItem key={`${column.accessor}-${index}`} divider disableGutters disabled={column.disabled} className={column.sticky ? 'd-none' : ''}>
                    <ListItemText id="switch-list-column" primary={column.Header} />
                    <ListItemSecondaryAction>
                      {column.sticky ? (
                        ''
                      ) : (
                        <Switch
                          size="small"
                          checked={column.isVisible}
                          onChange={(e) => {
                            handleToggle(column, e);
                          }}
                        />
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                )
            )
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
        <Button variant="outlined" color="primary" onClick={handleReset}>
          Reset
        </Button>
        <Button variant="contained" color="primary" disableElevation disabled={false} onClick={handleSaveChange}>
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
  accessor: string;
  index: number;
  columns: any[];
}

interface DragItem {
  index: number;
  accessor: string;
  type: string;
}

const RenderListItem = (props: ItemProps) => {
  const { column, handleToggle, moveItem, accessor, index, columns } = props;
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
      return { accessor, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging()
    })
  });

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));

  return column.sticky ? (
    <div className="d-none"></div>
  ) : (
    <div ref={ref} style={{ opacity }} data-handler-accessor={handlerId}>
      <ListItem divider disableGutters disabled={column.disabled}>
        <ListItemIcon className={`${classes.cursor} pl-2`}>
          <DragHandle />
        </ListItemIcon>
        <ListItemText id={column.accessor} primary={column.Header || startCase(column?.accessor)} />
        <ListItemSecondaryAction>
          <Switch
            size="small"
            disabled={column.disabled}
            checked={column.isVisible}
            onChange={(e) => {
              handleToggle(column, e);
            }}
          />
        </ListItemSecondaryAction>
      </ListItem>
    </div>
  );
};

export default ArrangeViewDialog;
