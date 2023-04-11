import { useState, useEffect, useContext, Fragment } from 'react';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem
} from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { quotation } from 'src/constants/helpers';
import EditIcon from '@material-ui/icons/Edit';
import GridDeleteIcon from 'src/components/Helpers/GridDeleteIcon';
import ServiceDialog from './ServiceDialog';
import { isMobile } from 'react-device-detect';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { genrateCustomTableColumns, flattenArray } from 'src/constants/columns';
import { ExpandMore } from '@material-ui/icons';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { fetch_quotation_service_fields } from 'src/components/Quotation/helper';
import DateRangeIcon from '@material-ui/icons/DateRange';
import LeadTimeDialog from './LeadTimeDialog';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import { calculateRowsField } from 'src/components/RentalManagment/helper';

const Service = ({ quotationData, setNextStep, renderedFrom, allowedToEdit, version }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [columns, setColumns] = useState([]);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [selectedServiceData, setSelectedServiceData] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteQuotationService, setDeleteQuotationService] = useState([]);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [leadTimeDialog, setLeadTimeDialog] = useState({ open: false, data: null });
  const [rowsData, setRowsData] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const versionId = quotationData?.versions[version]?._id || null;
  const [allFields, setAllFields] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const fields = await fetch_quotation_service_fields(quotationData?.currency);
    setAllFields(JSON.parse(JSON.stringify(fields)));
    const newColumns = genrateCustomTableColumns(fields, quotationData?.currency, renderedFrom);
    let column:any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
    ]
    const extraColoum = [
      {
        accessor: 'leadTime',
        Header: 'Lead Time (Days)',
        width: 100,
        Cell: ({row}) =>  <>{Array.isArray(row?.original?.leadTime) ? `${row?.original?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0}</>
      }
    ];
    column = [...column, ...newColumns, ...extraColoum]
    column.push({
      accessor: 'action',
      Header: 'Action',
      minWidth: 100,
      width: 150,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({row}) => 
      allowedToEdit && (
        <>
        <HtmlTooltip title="Edit">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowServiceDialog(true);
              setSelectedServiceData(row.original);
            }}
          >
            <EditIcon color="primary" />
          </IconButton>
        </HtmlTooltip>
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
        <GridDeleteIcon
          hasDeletePermission={allowedToEdit}
          ownerId={user?.user?._id}
          userId={user?.user?._id}
          onDelete={() => {
            setShowDeleteConfirmBox(true);
            setDeleteQuotationService([row.original._id]);
          }}
          entity="rentalManagement"
        />
      </> 
      )
    })
    setColumns(column);
    fetchQuotationService()
  };

  const fetchQuotationService = async() => {
    setNextStep(false)
    const response = await axiosInstance().get(`${quotation.api}/service/${quotationData._id}/${versionId}`);
    let rows = response?.data?.data;
    rows?.forEach((parent, i) => {
      parent.index = i + 1;
    });
    if (rows?.length) {
      setNextStep(true);
    } else {
      setNextStep(false);
    }
    setRowsData(rows);
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleAddService = (rows) => {
    axiosInstance()
      .post(`${quotation.api}/service/${quotationData._id}/${versionId}/add`, { services: rows })
      .then(({data}) => {
        fetchQuotationService();
        setShowServiceDialog(false);
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

  const handleUpdateService = (rows) => {
    rows.forEach((element) => {
      delete element.index;
      delete element.detail;
      delete element.isValid;
      delete element.hideSelection;
    });
    axiosInstance()
      .put(`${quotation.api}/service/${quotationData._id}/${versionId}/update`, { services: rows })
      .then(({data}) => {
        fetchQuotationService();
        setShowServiceDialog(false);
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

  const handleDelete = () => {
    axiosInstance()
      .post(`${quotation.api}/service/${quotationData._id}/${versionId}/delete`, { ids: deleteQuotationService })
      .then(({data}) => {
        fetchQuotationService();
        setShowDeleteConfirmBox(false);
        setDeleteQuotationService([]);
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
    handleUpdateService(rows);
  };


  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex">
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => {
              setShowServiceDialog(true);
              setSelectedServiceData(null);
            }}
          >
            Add Services and Consumables
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
                  setDeleteQuotationService(selectedRecords.map((d) => d._id));
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
      {showServiceDialog && (
        <ServiceDialog
          onClose={() => {
            setShowServiceDialog(false);
            setSelectedServiceData(null);
          }}
          handleAddService={handleAddService}
          handleUpdateService={handleUpdateService}
          currency={quotationData?.currency}
          serviceData={selectedServiceData}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete  ? `}
          onClose={() => setShowDeleteConfirmBox(false)}
          onOk={handleDelete}
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
            fetchQuotationService();
          }}
        />
      )}
    </Fragment>
  );
};

export default Service;
