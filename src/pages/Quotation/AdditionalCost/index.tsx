import { useState, useEffect, useContext, Fragment } from 'react';
import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { quotation } from '../../../constants/helpers';
import EditIcon from '@material-ui/icons/Edit';
import GridDeleteIcon from '../../../components/Helpers/GridDeleteIcon';
import AdditionalCostDialog from './AdditionalCostDialog';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import { CURReplaceByCurrencySingle } from '../../../constants/formulaUtility';
import { CHILD_RESOURCE } from '../../../constants/helpers';
import { flattenArray } from '../../../constants/columns';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import { Add, ExpandMore } from '@material-ui/icons';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import LeadTimeDialog from './LeadTimeDialog';
import DateRangeIcon from '@material-ui/icons/DateRange';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTableNew';

const AdditionalCost = ({ quotationData, setNextStep, renderedFrom, version, allowedToEdit, stepFullScreen }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const versionId = quotationData?.versions[version]?._id || null;
  const [isUpdating, setUpdating] = useState(false);
  const [columns, setColumns] = useState(null);
  const [showCostDialog, setShowCostDialog] = useState({ open: false, showSaveAndNext: false });
  const [selectedCostData, setSelectedCostData] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [allFields, setAllFields] = useState([]);
  const [deleteRecords, setDeleteRecords] = useState(null);
  const [leadTimeDialog, setLeadTimeDialog] = useState({ open: false, data: null });

  useEffect(() => {
    fetchFields();
    fetchData();
  }, []);

  const handleOpen = (row, rows) => {
    setShowCostDialog({
      open: true,
      showSaveAndNext: row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
    });
    setSelectedCostData(row.original);
  };

  const fetchFields = async () => {
    setColumns(null);
    var data = [];
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.quotationCost}`);
    data = response?.data?.data;
    const fields = CURReplaceByCurrencySingle(data, quotationData.currency);
    setAllFields(JSON.parse(JSON.stringify(fields)));
    const newColumns = generateColumns(renderedFrom, fields, null, false, quotationData?.currency);
    let column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      }
    ];
    column = [...column, ...newColumns];
    column.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 150,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row, table }) =>
        allowedToEdit && (
          <Fragment>
            <HtmlTooltip title="Edit">
              <IconButton
                size="small"
                aria-label="Clone"
                onClick={() => {
                  handleOpen(row, table.getRowModel().rows);
                }}
              >
                <EditIcon color="primary" />
              </IconButton>
            </HtmlTooltip>
            {permissions?.leadTimeMaster && (
              <HtmlTooltip title="Edit Lead Time">
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    setLeadTimeDialog({ open: true, data: row.original });
                  }}
                >
                  <DateRangeIcon fontSize="small" color="primary" />
                </IconButton>
              </HtmlTooltip>
            )}
            <GridDeleteIcon
              hasDeletePermission={permissions?.quotation?.isUpdate}
              ownerId={user?.user?._id}
              userId={user?.user?._id}
              onDelete={() => {
                setShowDeleteConfirmBox(true);
                setDeleteRecords([row.original._id]);
              }}
              entity="quotation"
            />
          </Fragment>
        )
    });
    setColumns(column);
  };

  const fetchData = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      dispatch({ type: 'selection', selectedRecords: [] });
      setNextStep(false);
      const response = await axiosInstance().get(`${quotation.api}/additionalcost/${quotationData._id}/${versionId}`);
      let rows = response?.data?.data;
      rows?.forEach((parent, i) => {
        parent.index = i + 1;
      });
      setNextStep(true);
      dispatch({ type: 'initialize', data: rows, count: rows?.lenght });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleAddCost = (rows) => {
    setUpdating(true);
    axiosInstance()
      .post(`${quotation.api}/additionalcost/${quotationData._id}/${versionId}/add`, { additionalCost: rows })
      .then(({ data }) => {
        setUpdating(false);
        fetchData();
        setShowCostDialog({ open: false, showSaveAndNext: false });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateCost = (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${quotation.api}/additionalcost/${quotationData._id}/${versionId}/update`, { additionalCost: rows })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setUpdating(false);
        if (saveAndNext) {
          const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
          setSelectedCostData(dataRows[rowIndex + 1]);
          setShowCostDialog({
            open: true,
            showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
          });
        } else {
          setShowCostDialog({ open: false, showSaveAndNext: false });
        }
        fetchData();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDeleteCost = () => {
    axiosInstance()
      .post(`${quotation.api}/additionalcost/${quotationData._id}/${versionId}/delete`, { ids: deleteRecords })
      .then(({ data }) => {
        fetchData();
        setShowDeleteConfirmBox(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData);
    handleUpdateCost(rows);
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex">
          <Button
            color="primary"
            variant="outlined"
            size="small"
            onClick={() => {
              setShowCostDialog({ open: true, showSaveAndNext: false });
              setSelectedCostData(null);
            }}
            startIcon={<Add />}
          >
            Add
          </Button>
        </Box>
        <div className="d-flex gap-2">
          <HtmlTooltip title="Please select some product">
            <span>
              <Button
                variant={'outlined'}
                color="default"
                size="small"
                onClick={openActions}
                disabled={selectedRecords.length ? false : true}
                aria-controls="action-menu"
                endIcon={<ExpandMore />}
                className="new-dropdown-v1"
              >
                {'Actions'}
              </Button>
            </span>
          </HtmlTooltip>
          <Menu
            anchorEl={anchorEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            id="action-menu"
            open={Boolean(anchorEl)}
            onClose={closeActions}
          >
            {permissions?.quotation?.isDelete && (
              <MenuItem
                onClick={() => {
                  closeActions();
                  setShowDeleteConfirmBox(true);
                  setDeleteRecords(selectedRecords.map((d) => d._id));
                }}
              >
                Delete
              </MenuItem>
            )}
          </Menu>
        </div>
      </Box>
      {columns ? (
        <Box zIndex={5}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            state={state}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            isClientSideGrid={true}
            expander={false}
            onSaveEdit={onSaveInlineEdit}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showCostDialog.open && (
        <AdditionalCostDialog
          onClose={() => {
            setShowCostDialog({ open: false, showSaveAndNext: false });
            setSelectedCostData(null);
          }}
          handleAddCost={handleAddCost}
          handleUpdateCost={handleUpdateCost}
          currency={quotationData?.currency}
          costData={selectedCostData}
          loadingEdit={isUpdating}
          showSaveAndNext={showCostDialog.showSaveAndNext}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete  ? `}
          onClose={() => setShowDeleteConfirmBox(false)}
          onOk={handleDeleteCost}
        />
      )}
      {leadTimeDialog.open && (
        <LeadTimeDialog
          quotationId={quotationData._id}
          data={leadTimeDialog?.data}
          versionId={versionId}
          onClose={() => {
            setLeadTimeDialog({ open: false, data: null });
          }}
          handleSucess={() => {
            setLeadTimeDialog({ open: false, data: null });
            fetchData();
          }}
        />
      )}
    </Fragment>
  );
};

export default AdditionalCost;
