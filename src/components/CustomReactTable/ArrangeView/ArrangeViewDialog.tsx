import {
  Box,
  Button,
  Dialog,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader,
  Switch,
  TextField,
  Theme,
  Typography,
  createStyles,
  makeStyles
} from '@material-ui/core';
import { DragHandle } from '@material-ui/icons';
import { XYCoord } from 'dnd-core';
import update from 'immutability-helper';
import { startCase } from 'lodash';
import React, { Dispatch, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { DndProvider, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import CustomDialogContent from '../../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../CustomDialog/CustomDialogHeader';
import { TActios, TInitialState } from '../hooks/useTableReducer';

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
  getToggleHideAllColumnsProps?: any;
  dispatch: Dispatch<TActios>;
  state: TInitialState;
  stickycolumns: { left: any[]; right: any[]; stickyColumns: any[] };
}

const ItemTypes = {
  CARD: 'card'
};

const ArrangeViewDialog = (props: ArrangeColumnsProps) => {
  const { onClose, columns, updateGridHiddenColumns, renderedFrom, dispatch, state, stickycolumns } = props;
  const { visibleColumns, columnOrder } = state;
  const isFirstRender = useRef(true);

  const classes = useStyles();
  const [sortedColumns, setSortedColumns] = React.useState([]);
  const [searchedColumns, setSearchedColumns] = React.useState([]);
  const [searchVal, setSearchVal] = React.useState('');
  const [stateVisibleColumns, setStateVisibleColumns] = useState(visibleColumns);

  const [allChecked, setAllChecked] = React.useState(true);
  const [isMinimized, setMinimized] = React.useState(true);

  React.useEffect(() => {
    const tempSortedColumns = columns
      .filter((c) => !stickycolumns.stickyColumns.includes(c.id))
      .toSorted((a: any, b: any) => {
        return columnOrder?.indexOf(a.id) - columnOrder?.indexOf(b.id);
      });

    setSortedColumns(tempSortedColumns);
  }, [columnOrder, columns, stickycolumns.stickyColumns]);

  useEffect(() => {
    if (isFirstRender.current && sortedColumns.length > 0 && visibleColumns) {
      setAllChecked(sortedColumns.every((col) => visibleColumns[col.id]));
      isFirstRender.current = false;
    }
  }, [visibleColumns, sortedColumns]);

  const handleToggle = (column: any, event: React.ChangeEvent<HTMLInputElement>) => {
    const visibleColumnState = { ...stateVisibleColumns, [column.id]: event.target.checked };
    setStateVisibleColumns(visibleColumnState);
    setAllChecked(sortedColumns.every((col) => visibleColumnState[col.id]));
  };

  const handleToggleAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColumns = [...sortedColumns];
    newColumns?.forEach((c: any) => {
      if (!c.disabled) {
        stateVisibleColumns[c.id] = event.target.checked;
      }
    });
    setAllChecked(event.target.checked);
  };

  const handleReset = () => {
    if (renderedFrom && renderedFrom !== '') {
      updateGridHiddenColumns([], []);
    }
    const colOrder = columns?.map((col) => col?.id);
    dispatch({ type: 'setColumnOrder', columnOrder: colOrder });

    const showTrueColumns = columns.filter((c) => {
      if ('show' in c) {
        return c.show === true;
      }
      return true;
    });

    const visibleColumns = {};
    showTrueColumns.forEach((col) => {
      visibleColumns[col.id] = true;
    });
    dispatch({ type: 'setVisibleColumns', visibleColumns });
    onClose();
  };

  const handleSaveChange = () => {
    const columnOrderToStore = [];
    for (const col of sortedColumns) {
      if (col.accessor === 'qtyDisplay') {
        columnOrderToStore.push('qtyDisplay');
        columnOrderToStore.push('qty');
        continue;
      }
      columnOrderToStore.push(col.id);
    }
    const columnOrder = [...stickycolumns.left, ...columnOrderToStore, ...stickycolumns.right];
    dispatch({ type: 'setVisibleColumns', visibleColumns: stateVisibleColumns });
    dispatch({ type: 'setColumnOrder', columnOrder: columnOrder });

    if (renderedFrom && renderedFrom !== '') {
      const hidedColumns = Object.keys(stateVisibleColumns).filter((c) => !stateVisibleColumns[c]);
      updateGridHiddenColumns(hidedColumns, columnOrderToStore);
    }

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
      const fieldName = typeof col.header === 'string' ? col.header.toLowerCase() : '';
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
                <Switch size="small" checked={allChecked} onChange={handleToggleAll} />
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
                      checked={stateVisibleColumns[column.id]}
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
                  <ListItem
                    key={`${column.accessor}-${index}`}
                    divider
                    disableGutters
                    disabled={column.disabled}
                    className={['left', 'right']?.includes(column?.sticky) ? 'd-none' : ''}
                  >
                    <ListItemText id="switch-list-column" primary={column.header} />
                    <ListItemSecondaryAction>
                      {['left', 'right']?.includes(column?.sticky) ? (
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
  checked: boolean;
}

interface DragItem {
  index: number;
  accessor: string;
  type: string;
}

const RenderListItem = (props: ItemProps) => {
  const { column, handleToggle, moveItem, accessor, index, columns, checked } = props;
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

  return ['left', 'right']?.includes(column?.sticky) ? (
    <div className="d-none"></div>
  ) : (
    <div ref={ref} style={{ opacity }} data-handler-accessor={handlerId}>
      <ListItem divider disableGutters disabled={column.disabled}>
        <ListItemIcon className={`${classes.cursor} pl-2`}>
          <DragHandle />
        </ListItemIcon>
        <ListItemText id={column.accessor} primary={column.header || startCase(column?.accessor)} />
        <ListItemSecondaryAction>
          <Switch
            size="small"
            disabled={column.disabled}
            checked={checked}
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
