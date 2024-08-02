import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Button,
  Dialog,
  IconButton,
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
import { Delete, DragHandle, Edit, Save } from '@material-ui/icons';
import update from 'immutability-helper';
import { startCase } from 'lodash';
import React, { Dispatch, useContext, useEffect, useRef, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from '../../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../CustomDialog/CustomDialogHeader';
import { TActios, TInitialState } from '../hooks/useTableReducer';
import ConfirmationDialog from '../../Helpers/ConfirmationDialog';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { useDndSensors } from 'src/hooks';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import SaveEditArrangeView, { FormSchema } from 'src/components/CustomReactTable/ArrangeView/SaveEditArrangeView';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Autocomplete } from '@material-ui/lab';

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

export type SavedData = {
  _id: string;
  name: string;
  access: string;
  key: string;
  hide: string[];
  order: string[];
  brand: string;
  user: string;
  createdBy: CreatedBy;
};

export type CreatedBy = {
  user: string;
  date: Date;
};

const ArrangeViewDialog = (props: ArrangeColumnsProps) => {
  const toastConfig = useContext(CustomToastContext);
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

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState<{ open: boolean; defaultValue: (FormSchema & { _id: string }) | null }>(null);
  const [savedData, setSavedData] = useState<SavedData[]>(null);
  const [selectedSavedData, setSelectedSavedData] = useState<SavedData>(null);
  const [isSaveViewDeleteConfirm, setIsSaveViewDeleteConfirm] = useState<{ ids: string[]; open: boolean }>({ open: false, ids: null });

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

  const handleApplyChange = (order?: string[], hidden?: string[]) => {
    let columnOrderToStore, hidedColumns;
    if (order && hidden) {
      columnOrderToStore = order;
      hidedColumns = hidden;
    } else {
      const data = getOrderAndHiddenColumns();
      columnOrderToStore = data.order;
      hidedColumns = data.hidden;
    }
    const columnOrder = [...stickycolumns.left, ...columnOrderToStore, ...stickycolumns.right];
    dispatch({ type: 'setVisibleColumns', visibleColumns: stateVisibleColumns });
    dispatch({ type: 'setColumnOrder', columnOrder: columnOrder });

    if (renderedFrom && renderedFrom !== '') {
      updateGridHiddenColumns(hidedColumns, columnOrderToStore);
    }

    onClose();
  };

  const getOrderAndHiddenColumns = () => {
    const order = [];
    const hidden = Object.keys(stateVisibleColumns).filter((c) => !stateVisibleColumns[c]);

    for (const col of sortedColumns) {
      if (col.accessor === 'qtyDisplay') {
        order.push('qtyDisplay');
        order.push('qty');
        continue;
      }
      order.push(col.id);
    }

    return { order, hidden };
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

  const sensors = useDndSensors();

  const applySavedColumns = (data: SavedData) => {
    if (!data) return;
    setStateVisibleColumns((prev) => {
      const temp = { ...prev };
      Object.keys(temp).forEach((key) => {
        temp[key] = !data.hide.includes(key);
      });
      setAllChecked(sortedColumns.every((col) => temp[col.id]));
      return temp;
    });
    const tempSortedColumns = [...columns]
      .filter((c) => !stickycolumns?.stickyColumns?.includes(c.id))
      ?.sort((a: any, b: any) => {
        return data.order?.indexOf(a.id) - data.order?.indexOf(b.id);
      });

    if (tempSortedColumns)
      setSortedColumns(
        tempSortedColumns.filter((column) => !['left', 'right']?.includes(column?.sticky) || !['selection', 'expander'].includes(column.accessor))
      );
  };

  const getAllSavedViews = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get('/user/grid-view');
      setSavedData(data.filter((d) => d.key === renderedFrom));
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const deleteSavedView = async () => {
    if (!isSaveViewDeleteConfirm?.ids) return;
    try {
      const {
        data: { data }
      } = await axiosInstance().put('/user/grid-view/remove', { ids: isSaveViewDeleteConfirm?.ids });
      if (data) {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Deleted successfully'
        });
        setIsSaveViewDeleteConfirm({ open: false, ids: null });
        setSelectedSavedData(null);
        getAllSavedViews();
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    getAllSavedViews();
  }, []);

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
        <div className="my-2">
          <Autocomplete
            disabled={savedData?.length === 0 || !savedData}
            value={selectedSavedData}
            onChange={(event: any, newValue: SavedData) => {
              setSelectedSavedData(newValue);
              applySavedColumns(newValue);
            }}
            id="controllable-states-demo"
            options={savedData || []}
            fullWidth
            size="small"
            getOptionLabel={(option) => option?.name}
            renderOption={(option) => (
              <div className="flex w-full justify-between gap-2">
                <Typography noWrap>{option.name}</Typography>
                <div>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.currentTarget.disabled = true;
                      setIsSaveViewDeleteConfirm({ open: true, ids: [option._id] });
                    }}
                  >
                    <Delete fontSize="small" color="error" />
                  </IconButton>
                </div>
              </div>
            )}
            renderInput={(params) => <TextField size="small" margin="none" {...params} label="Select saved view" variant="outlined" />}
          />
        </div>
        <List
          disablePadding
          subheader={
            <Box className="flex flex-wrap items-center sm:gap-2">
              <ListSubheader disableGutters disableSticky>
                Toggle and Drag & Drop to arrange
              </ListSubheader>
              <div className="w-full sm:ml-auto sm:w-1/2">
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
                          disabled={column.disabled}
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
        <div className="flex w-full items-center justify-between gap-2">
          <ThemeButton
            borderColor="none"
            color="primary"
            iconForMobile={false}
            onClick={() => {
              setSavedData(null);
              if (selectedSavedData) {
                setSelectedSavedData(null);
                setIsSaveDialogOpen({
                  open: true,
                  defaultValue: { access: selectedSavedData.access, name: selectedSavedData.name, setAsDefault: false, _id: selectedSavedData._id }
                });
              } else {
                setIsSaveDialogOpen((prev) => ({ ...prev, open: true }));
              }
            }}
          >
            {selectedSavedData ? 'Update' : 'Save'}
          </ThemeButton>
          <div className="flex items-center gap-2 ">
            <ThemeButton iconForMobile={false} onClick={onClose}>
              Close
            </ThemeButton>
            <ThemeButton iconForMobile={false} onClick={handleReset}>
              Reset
            </ThemeButton>

            <ThemeButton
              iconForMobile={false}
              borderColor="none"
              color="primary"
              disableElevation
              disabled={false}
              onClick={() => handleApplyChange()}
            >
              Apply
            </ThemeButton>
          </div>
        </div>
      </CustomDialogFooter>
      {isSaveDialogOpen?.open && (
        <SaveEditArrangeView
          onClose={() => setIsSaveDialogOpen(null)}
          getAllSavedViews={getAllSavedViews}
          renderedFrom={renderedFrom}
          defaultValue={isSaveDialogOpen.defaultValue}
          {...getOrderAndHiddenColumns()}
        />
      )}
      {isSaveViewDeleteConfirm.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete ?`}
          onClose={() => setIsSaveViewDeleteConfirm({ open: false, ids: null })}
          onOk={() => {
            setSavedData(null);
            deleteSavedView();
          }}
        />
      )}
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
    }
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
        isDragging ? ' bg-[var(--dark-secondary,theme("colors.blue.200"))] ' : 'bg-[var(--dark-secondary,#fff)]'
      } list-none transition-colors`}
    >
      <div
        className={`flex items-center p-[8px_17px_8px_0] [border-bottom:1px_solid_var(--common-border-color)] ${
          index === 0 ? '[border-top:1px_solid_var(--common-border-color)]' : ''
        } `}
      >
        <ListItemIcon className={` cursor-grab pl-2 ${isDragging ? ' cursor-grabbing' : ''}`} {...attributes} {...listeners}>
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
