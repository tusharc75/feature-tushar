import { CSS } from '@dnd-kit/utilities';
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
  makeStyles,
  useMediaQuery
} from '@material-ui/core';
import { DragHandle } from '@material-ui/icons';
import update from 'immutability-helper';
import { startCase } from 'lodash';
import React, { Dispatch, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from '../../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../CustomDialog/CustomDialogHeader';
import { TActios, TInitialState } from '../hooks/useTableReducer';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable } from '@dnd-kit/sortable';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxHeight: 400,
      backgroundColor: theme.palette.background.paper
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

const ArrangeViewDialog = (props: ArrangeColumnsProps) => {
  const isMobileView = useMediaQuery('(max-width:768px)');
  const { onClose, columns = [], updateGridHiddenColumns, renderedFrom, dispatch, state, stickycolumns } = props;
  const { visibleColumns, columnOrder } = state;
  const isFirstRender = useRef(true);

  const classes = useStyles();
  const [sortedColumns, setSortedColumns] = React.useState([]);
  const [searchedColumns, setSearchedColumns] = React.useState([]);
  const [searchVal, setSearchVal] = React.useState('');
  const [stateVisibleColumns, setStateVisibleColumns] = useState(visibleColumns);
  const [activeItem, setActiveItem] = useState(null);

  const [allChecked, setAllChecked] = React.useState(true);
  const [isMinimized, setMinimized] = React.useState(true);

  React.useEffect(() => {
    const tempSortedColumns = [...columns]
      .filter((c) => !stickycolumns?.stickyColumns?.includes(c.id))
      ?.sort((a: any, b: any) => {
        return columnOrder?.indexOf(a.id) - columnOrder?.indexOf(b.id);
      });

    if (tempSortedColumns)
      setSortedColumns(
        tempSortedColumns.filter((column) => !['left', 'right']?.includes(column?.sticky) || !['selection', 'expander'].includes(column.accessor))
      );
  }, [columnOrder, columns, stickycolumns?.stickyColumns]);

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

    const visibleColumns = {};
    columns.forEach((col) => {
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

  const moveItem = (event: DragEndEvent) => {
    setActiveItem(null);
    if (!event.over || event.active.id === event.over.id) return;
    const { active, over } = event;
    const dragIndex = active.data.current.index;
    const dropIndex = over.data.current.index;

    const dragCard = sortedColumns[dragIndex];
    const hoverCard = sortedColumns[dropIndex];

    if (dragCard?.accessor === 'action' || dragCard?.accessor === 'selection' || dragCard?.lockPosition) return;
    if (hoverCard?.accessor === 'action' || hoverCard?.accessor === 'selection' || hoverCard?.lockPosition) return;

    const columnsForGrid = update(sortedColumns, {
      $splice: [
        [dragIndex, 1],
        [dropIndex, 0, dragCard]
      ]
    });
    setSortedColumns([...columnsForGrid]);
  };

  const onDragStart = (event: DragStartEvent) => {
    if (!event) return;
    setActiveItem(event?.active?.data.current?.props);
  };

  useEffect(() => {
    if (!searchVal) return;
    const matchedColumns = sortedColumns.filter((col) => {
      const fieldName = typeof col.header === 'string' ? col.header.toLowerCase() : '';
      return fieldName.includes(searchVal.toLowerCase());
    });
    setSearchedColumns(matchedColumns);
  }, [searchVal]);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10
    }
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 300,
      tolerance: 5
    }
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth fullScreen={!isMinimized || (isMobile && !isTablet) || isMobileView}>
      <CustomDialogHeader
        title="Arrange View"
        onClose={onClose}
        showRequiredLabel={false}
        showManimizeMaximize={isMobileView ? false : true}
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
            <DndContext onDragEnd={moveItem} modifiers={[restrictToVerticalAxis]} onDragStart={onDragStart} sensors={sensors}>
              <SortableContext items={sortedColumns.map((c) => c.accessor)}>
                <ul className="list-none">
                  {sortedColumns.map((column, index) => (
                    <RenderListItem
                      key={column.accessor}
                      checked={stateVisibleColumns[column.id]}
                      column={column}
                      index={index}
                      handleToggle={handleToggle}
                    />
                  ))}
                </ul>
              </SortableContext>
              <DragOverlay>
                {activeItem && (
                  <span className="[&_.MuiListItemIcon-root]:!cursor-grabbing">
                    <RenderListItem {...activeItem} />
                  </span>
                )}
              </DragOverlay>
            </DndContext>
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
                          checked={stateVisibleColumns[column.id]}
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
  handleToggle: any;
  checked: boolean;
  index: number;
}

const RenderListItem = (props: ItemProps) => {
  const { column, handleToggle, checked, index } = props;

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.accessor,
    data: {
      type: 'Column',
      index,
      props: { column, handleToggle, checked, index }
    },
    disabled: column.disabled
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  return ['left', 'right']?.includes(column?.sticky) || ['selection', 'expander'].includes(column.accessor) ? (
    <div className="d-none"></div>
  ) : (
    <li
      ref={setNodeRef}
      style={style}
      className={`${
        isDragging
          ? ' bg-[var(--dark-secondary,theme("colors.cyan.100"))] opacity-50 [border:4px_dashed_var(--common-border-color)]'
          : 'bg-[var(--dark-secondary,#fff)]'
      } transition-colors list-none`}
    >
      <div
        className={`p-[8px_17px_8px_0] flex items-center [border-bottom:1px_solid_var(--common-border-color)] ${
          index === 0 ? '[border-top:1px_solid_var(--common-border-color)]' : ''
        } ${column.disabled ? ' opacity-65 pointer-events-none' : ''}`}
      >
        <ListItemIcon className={` pl-2 cursor-grab ${isDragging ? ' cursor-grabbing' : ''}`} {...attributes} {...listeners}>
          <DragHandle />
        </ListItemIcon>
        <ListItemText id={column.accessor} primary={column.header || startCase(column?.accessor)} className=" select-none" />
        <Switch
          size="small"
          disabled={column.disabled}
          checked={checked}
          onChange={(e) => {
            handleToggle(column, e);
          }}
        />
      </div>
    </li>
  );
};

export default ArrangeViewDialog;
