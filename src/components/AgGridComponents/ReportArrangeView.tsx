import React from 'react';
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
  TextField,
  CircularProgress
} from '@material-ui/core';
import { DragHandle } from '@material-ui/icons';
import { XYCoord } from 'dnd-core';
import { DndProvider, useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';

import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';

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
  setColumns: any;
  columnApi: any;
  isClientSideGrid: boolean;
  saveColumnOptions: boolean;
  updateGridHiddenColumns: any;
  renderedFrom: string;
  selectedReportView: object | any;
  setSelectedReportView: any;
}

const ItemTypes = {
  CARD: 'card'
};

const ReportArrangeView = (props: ArrangeColumnsProps) => {
  const {
    onClose,
    columns,
    setColumns,
    columnApi,
    isClientSideGrid,
    updateGridHiddenColumns,
    renderedFrom,
    saveColumnOptions,
    selectedReportView,
    setSelectedReportView
  } = props;
  const classes = useStyles();
  const [sortedColumns, setSortedColumns] = React.useState([]);
  const [allChecked, setAllChecked] = React.useState(false);
  const toastConfig = React.useContext(CustomToastContext);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [reportName, setReportName] = React.useState(selectedReportView ? selectedReportView.name : '');
  const [lockedItem, setLockedItem] = React.useState({
    index: 0,
    column: {}
  });

  React.useEffect(() => {
    if (!columnApi) return;
    let newCols = new Array();
    let layedCols = [];
    let savedColumns = [];
    if (!selectedReportView) {
      layedCols = columnApi.getAllGridColumns();
      layedCols = layedCols.filter((col) => col.pinned === null).map((col: any) => col.colId);
    } else {
      savedColumns = JSON.parse(selectedReportView.columnState);
      layedCols = savedColumns.map((col: any) => col.colId);
    }

    columns.forEach((col) => {
      const index = layedCols.indexOf(col.field);
      const colData = savedColumns.find((_col) => _col.colId === col.field);
      if (index > -1) {
        newCols[index] = { ...col, show: selectedReportView && colData ? !colData.hide : true };
      }
    });

    newCols = newCols.filter((item) => item);

    setSortedColumns(newCols);
  }, [columns, columnApi, selectedReportView]);

  const handleToggle = (column: any) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColumns = [...sortedColumns];
    const getFieldIndex = sortedColumns.findIndex((d) => d.field === column.field);
    newColumns[getFieldIndex].show = event.target.checked;

    setSortedColumns(newColumns);
  };

  const handleToggleAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColumns = [...sortedColumns];
    newColumns?.forEach((e: any) => {
      if (!e.disabled) {
        e.show = event.target.checked;
      }
    });
    setSortedColumns(newColumns);
  };

  const handleSaveChange = () => {
    const newColumns = [...sortedColumns];
    // newColumns.splice(lockedItem.index, 0, lockedItem.column);
    setColumns(newColumns);
    const colIds = newColumns.map((col) => col.field);
    const oldColumnState = columnApi.getColumnState();
    let newColumnsState = new Array();

    for (const d of oldColumnState) {
      const index = colIds.indexOf(d.colId);
      newColumnsState.splice(index, 0, { ...d });
    }
    columnApi.setColumnState(newColumnsState);

    const hiddenColumns = newColumns.filter((d) => !d.show).map((m) => m.field);
    const nonHiddenColumns = newColumns.filter((d) => d.show).map((m) => m.field);
    columnApi.setColumnsVisible(hiddenColumns, false);
    columnApi.setColumnsVisible(nonHiddenColumns, true);

    if (!isClientSideGrid || saveColumnOptions) {
      let tempColumnState = columnApi.getColumnState();
      let hidedColumns = tempColumnState.filter((o) => o?.hide).map((o) => o?.colId);
      updateGridHiddenColumns(hidedColumns);
    }

    const columnState = JSON.stringify(columnApi.getColumnState());
    saveColumnSettings(columnState);
  };

  const saveColumnSettings = (columnState: any) => {
    if (selectedReportView) {
      setSubmitting(true);
      axiosInstance()
        .put(`/report-colum-setting/${selectedReportView._id}`, {
          resource: renderedFrom.split('_')[0],
          columnState: columnState,
          name: reportName.trimEnd()
        })
        .then(({data: {data}}) => {
          setSubmitting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'Settings saved successfully'
          });
          setSelectedReportView(data)
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
          columnState: columnState,
          name: reportName.trimEnd()
        })
        .then(({data: {data}}) => {
          setSubmitting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'Settings saved successfully'
          });
          setSelectedReportView(data)
          onClose();
        })
        .catch((error) => {
          setSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  /**
   *
   *  Drag'n'Drop function
   *
   */
  const moveItem = React.useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragCard = sortedColumns[dragIndex];
      const updatedIndexColumns = update(sortedColumns, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragCard]
        ]
      });
      setSortedColumns(updatedIndexColumns);
    },
    [sortedColumns]
  );

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <CustomDialogHeader title="Arrange View" onClose={onClose} showRequiredLabel={false} />
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
          onChange={(e) => {
            setReportName(e.target.value.trimStart());
          }}
        />
        <List
          disablePadding
          subheader={
            <ListSubheader disableGutters disableSticky>
              Toggle and Drag & Drop to arrange
            </ListSubheader>
          }
          className={classes.root}
        >
          <ListItem disableGutters dense>
            <ListItemText primary="Column Name" />
            <ListItemSecondaryAction>
              <ListItemText primary="Toggle (hide/show)" />
            </ListItemSecondaryAction>
          </ListItem>
          <ListItem disableGutters>
            <ListItemText primary="All Columns" />
            <ListItemSecondaryAction>
              <Switch size="small" checked={allChecked} onChange={handleToggleAll} />
            </ListItemSecondaryAction>
          </ListItem>
          <DndProvider backend={HTML5Backend}>
            {sortedColumns.map((column, index) => (
              <RenderListItem
                key={column.field}
                column={column}
                handleToggle={handleToggle}
                moveItem={moveItem}
                index={index}
                id={column.field}
                columns={sortedColumns}
              />
            ))}
          </DndProvider>
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
          disabled={isSubmitting || !Boolean(reportName)}
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
  handleToggle: CallableFunction;
  moveItem: CallableFunction;
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
      isDragging: monitor.isDragging()
    })
  });

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));

  return (
    <div ref={ref} style={{ opacity }} data-handler-id={handlerId}>
      <ListItem divider disableGutters disabled={column.disabled}>
        <ListItemIcon className={classes.cursor}>
          <DragHandle />
        </ListItemIcon>
        <ListItemText id="switch-list-column" primary={column.headerName} />
        <ListItemSecondaryAction>
          <Switch size="small" disabled={column.disabled} checked={column.show} onChange={handleToggle(column)} />
        </ListItemSecondaryAction>
      </ListItem>
    </div>
  );
};

export default ReportArrangeView;
