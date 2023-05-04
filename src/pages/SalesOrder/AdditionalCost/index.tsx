import { useState, useEffect, useContext, Fragment } from 'react';
import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { salesOrder } from '../../../constants/helpers';
import EditIcon from '@material-ui/icons/Edit';
import GridDeleteIcon from '../../../components/Helpers/GridDeleteIcon';
import AdditionalCostDialog from './AdditionalCostDialog';
import { isMobile } from 'react-device-detect';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import { CURReplaceByCurrencySingle } from '../../../constants/formulaUtility';
import { CHILD_RESOURCE } from '../../../constants/helpers';
import { generateCustomTableColumns, flattenArray } from '../../../constants/columns';
import { GrBusinessService } from 'react-icons/all';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import { ExpandMore } from '@material-ui/icons';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';

const AdditionalCost = ({ salesOrderData, setNextStep, renderedFrom, allowedToEdit }) => {

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  
  const [columns, setColumns] = useState([]);
  const [rowsData, setRowsData] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showCostDialog, setShowCostDialog] = useState(false);
  const [selectedCostData, setSelectedCostData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecords, setDeleteRecords] = useState(null);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    var data = [];
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.salesOrderCost}`);
    data = response?.data?.data;
    const fields = CURReplaceByCurrencySingle(data, salesOrderData.currency);
    setAllFields(JSON.parse(JSON.stringify(fields)));
    const newColumns = generateCustomTableColumns(fields, salesOrderData?.currency, renderedFrom);
    let column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      }
    ];
    column = [...column, ...newColumns];
    column.push({
      accessor: 'action',
      Header: 'Action',
      minWidth: 100,
      width: 150,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) =>
        allowedToEdit && (
          <Fragment>
            <HtmlTooltip title="Edit">
              <IconButton
                size="small"
                aria-label="Clone"
                onClick={() => {
                  setShowCostDialog(true);
                  setSelectedCostData(row.original);
                }}
              >
                <EditIcon color="primary" />
              </IconButton>
            </HtmlTooltip>
            <GridDeleteIcon
              hasDeletePermission={permissions?.salesOrder?.isUpdate}
              ownerId={user?.user?._id}
              userId={user?.user?._id}
              onDelete={() => {
                setShowDeleteConfirmBox(true);
                setDeleteRecords([row.original._id]);
              }}
              entity="salesOrder"
            />
          </Fragment>
        )
    });
    setColumns(column);
    fetchAdditionalCost()
  };

  const fetchAdditionalCost = async () => {
    try {
      setNextStep(false);  
      const response = await axiosInstance().get(`${salesOrder.api}/additionalcost/${salesOrderData._id}`);
      let rows = response?.data?.data;
      rows?.forEach((parent, i) => {
        parent.index = i + 1;
      });
      setNextStep(true);
      setRowsData(rows);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleAddCost = (rows) => {
    axiosInstance()
      .post(`${salesOrder.api}/additionalcost/${salesOrderData._id}/add`, { additionalCost: rows })
      .then(({data}) => {
        fetchAdditionalCost();
        setShowCostDialog(false);
        toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateCost = (rows) => {
    rows.forEach((element) => {
        delete element.index;
        delete element.isValid;
        delete element.hideSelection;
      });
    axiosInstance()
      .put(`${salesOrder.api}/additionalcost/${salesOrderData._id}/update`, { additionalCost: rows })
      .then(({data}) => {
        fetchAdditionalCost();
        setShowCostDialog(false);
        toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDeleteCost = () => {
    axiosInstance()
      .post(`${salesOrder.api}/additionalcost/${salesOrderData._id}/delete`, { ids: deleteRecords })
      .then(({data}) => {
        fetchAdditionalCost();
        setShowDeleteConfirmBox(false)
        toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(rowsData)?.find((d) => d._id === updatedData._id);
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(rowsData), inputField, allFields, updatedData);
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
            variant={isMobile ? 'outlined' : 'contained'}
            color="primary"
            size="small"
            onClick={() => {
              setShowCostDialog(true);
              setSelectedCostData(null);
            }}
          >
            {isMobile ? <GrBusinessService size={20} /> : 'Add'}
          </Button>
        </Box>
        <div className="d-flex gap-2">
          <HtmlTooltip title="Please select some records">
            <span>
              <Button
                variant={'outlined'}
                color="default"
                size="small"
                onClick={openActions}
                disabled={selectedRecords.length ? false : true}
                aria-controls="action-menu"
                endIcon={<ExpandMore />}
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
      {columns && rowsData ? (
        <Box zIndex={5}>
          <CustomReactTable
            height={'calc(100vh - 395px)'}
            columns={columns}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
            onSelect={setSelectedRecords}
            childrenProperty="subRows"
            uniqueKey="_id"
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            hideExpander={true}
            onSaveEdit={onSaveInlineEdit}
          />
        </Box>
      ) : (
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showCostDialog && (
        <AdditionalCostDialog
          onClose={() => {
            setShowCostDialog(false);
            setSelectedCostData(null);
          }}
          handleAddCost={handleAddCost}
          handleUpdateCost={handleUpdateCost}
          currency={salesOrderData?.currency}
          costData={selectedCostData}
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
    </Fragment>
  );
};

export default AdditionalCost;
