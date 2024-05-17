import { DragDropContext, Draggable, DraggableProvidedDragHandleProps, DropResult, Droppable } from '@hello-pangea/dnd';
import {
  Box,
  Button,
  CircularProgress,
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
import update from 'immutability-helper';
import { startCase } from 'lodash';
import React, { Dispatch, useEffect } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
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
    }
  })
);

interface ArrangeColumnsProps {
  onClose: VoidFunction;
  columns: any[];
  updateGridHiddenColumns: any;
  renderedFrom: string;
  getToggleHideAllColumnsProps?: any;
  selectedReportView: object | any;
  setSelectedReportView: any;
  dispatch: Dispatch<TActios>;
  state: TInitialState;
}

const ReportArrangeView = (props: ArrangeColumnsProps) => {
  const { onClose, columns, renderedFrom, selectedReportView, setSelectedReportView, dispatch } = props;

  const classes = useStyles();
  const [sortedColumns, setSortedColumns] = React.useState([]);
  const [searchedColumns, setSearchedColumns] = React.useState([]);
  const [searchVal, setSearchVal] = React.useState('');

  const [allChecked, setAllChecked] = React.useState(true);
  const [isMinimized, setMinimized] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [reportName, setReportName] = React.useState(selectedReportView ? selectedReportView.name : '');
  const [isSubmitting, setSubmitting] = React.useState(false);

  const toastConfig = React.useContext(CustomToastContext);

  React.useEffect(() => {
    try {
      if (!selectedReportView) {
        const updatedCols = columns.map((col) => ({
          ...col,
          isVisible: col?.show === false ? false : true
        }));
        setSortedColumns(updatedCols);
      } else {
        let savedColumns = selectedReportView.columnState;
        let updatedCols = columns.map((col) => ({
          ...col,
          isVisible: savedColumns?.find((column) => column.accessor === col.accessor)?.isVisible
        }));

        if (savedColumns) {
          const colOrder = savedColumns.map((m) => m.accessor);
          const actionCol = updatedCols.find((d) => d.accessor === 'action');
          const expanderCol = updatedCols.find((d) => d.accessor === 'expander');
          const selectionCol = updatedCols.find((d) => d.accessor === 'selection');
          updatedCols = [
            ...(expanderCol ? [expanderCol] : []),
            ...(selectionCol ? [selectionCol] : []),
            ...updatedCols
              .filter((d) => !['expander', 'selection', 'action']?.includes(d.accessor))
              .sort((a, b) => colOrder.findIndex((d) => d === a.accessor) - colOrder.findIndex((d) => d === b.accessor)),
            ...(actionCol ? [actionCol] : [])
          ];
        }
        setSortedColumns(updatedCols);
      }
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

  const handleSaveChange = () => {
    if (!reportName) {
      setError('Report name is required')!;
      return;
    }
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
    // setColumnOrder([...sortedColumns.map((m) => m.accessor)]);
    // setHiddenColumns([...sortedColumns].filter((f) => f.sticky === undefined && f.isVisible === false).map((m) => m.accessor));
    const newColState = sortedColumns?.map(({ accessor, isVisible }) => ({ accessor, isVisible }));
    dispatch({ type: 'updateColumnState', colState: newColState });

    saveColumnSettings(sortedColumns);
  };

  const saveColumnSettings = (columnState: any) => {
    const newColState = columnState?.map(({ accessor, isVisible }) => ({ accessor, isVisible }));
    const visibleColumns = {};
    for (const col of newColState) {
      visibleColumns[col.accessor] = col.isVisible;
    }
    dispatch({ type: 'setColumnOrder', columnOrder: newColState.map((col) => col.accessor) });
    dispatch({ type: 'setVisibleColumns', visibleColumns: visibleColumns });
    if (selectedReportView) {
      setSubmitting(true);
      axiosInstance()
        .put(`/report-colum-setting/${selectedReportView._id}`, {
          resource: renderedFrom.split('_')[0],
          columnState: newColState,
          name: reportName.trimEnd()
        })
        .then(({ data: { data } }) => {
          setSubmitting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'Settings saved successfully'
          });
          setSelectedReportView(data);
          onClose();
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      setSubmitting(true);
      axiosInstance()
        .post(`/report-colum-setting`, {
          resource: renderedFrom.split('_')[0],
          columnState: newColState,
          name: reportName.trimEnd()
        })
        .then(({ data: { data } }) => {
          setSubmitting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'Settings saved successfully'
          });
          setSelectedReportView(data);
          onClose();
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const moveItem = React.useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const dragIndex = result.source.index;
      const dropIndex = result.destination?.index;

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
        <TextField
          required
          variant="outlined"
          type="text"
          label="Report View Name"
          name="reportName"
          fullWidth
          margin="dense"
          value={reportName}
          error={Boolean(error)}
          helperText={Boolean(error) && error}
          onChange={(e) => {
            const value = e.target.value.trimStart();
            setReportName(value);
            if (value) {
              setError(null);
            }
          }}
        />
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
            <>
              <DragDropContext onDragEnd={moveItem}>
                <Droppable droppableId="arrangeView">
                  {(provided) => (
                    <ul className="list-none" {...provided.droppableProps} ref={provided.innerRef}>
                      {sortedColumns.map((column, index) => (
                        <Draggable key={column.accessor} draggableId={column.accessor} index={index} isDragDisabled={column.disabled}>
                          {(provided, snapshot) => (
                            <li
                              {...provided.draggableProps}
                              ref={provided.innerRef}
                              className={`${snapshot.isDragging ? ' bg-[var(--dark-secondary,#ebebeb)]' : ''} transition-colors`}
                            >
                              <RenderListItem
                                key={column.accessor}
                                dragHandleProps={provided.dragHandleProps}
                                column={column}
                                handleToggle={handleToggle}
                                index={index}
                              />
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>
            </>
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
                    className={column.sticky ? 'd-none' : ''}
                  >
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
        <Button
          startIcon={isSubmitting && <CircularProgress size={18} color="inherit" />}
          variant="contained"
          color="primary"
          disableElevation
          disabled={isSubmitting}
          onClick={handleSaveChange}
        >
          Save changes
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

interface ItemProps {
  column: any;
  handleToggle: any;
  index: number;
  dragHandleProps: DraggableProvidedDragHandleProps;
}

const RenderListItem = (props: ItemProps) => {
  const { column, handleToggle, index, dragHandleProps } = props;

  return ['left', 'right']?.includes(column?.sticky) || ['selection', 'expander'].includes(column.accessor) ? (
    <div className="d-none"></div>
  ) : (
    <div
      className={`p-[8px_17px_8px_0] flex items-center [border-bottom:1px_solid_var(--common-border-color)] ${
        index === 0 ? '[border-top:1px_solid_var(--common-border-color)]' : ''
      } ${column.disabled ? ' opacity-65 pointer-events-none' : ''}`}
    >
      <ListItemIcon className={` pl-2`} {...dragHandleProps}>
        <DragHandle />
      </ListItemIcon>
      <ListItemText id={column.accessor} primary={column.Header || startCase(column?.accessor)} />
      <Switch
        size="small"
        disabled={column.disabled}
        checked={column.isVisible}
        onChange={(e) => {
          handleToggle(column, e);
        }}
      />
    </div>
  );
};

export default ReportArrangeView;
