import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import {
  Grid,
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Tab,
  Tabs,
  ButtonGroup,
  Container,
  InputAdornment,
  TextField,
  Menu,
  MenuItem
} from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { quotation, PURCHASE_ORDER_STATUS } from 'src/constants/helpers';
import EditIcon from '@material-ui/icons/Edit';
import { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import { CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import GridDeleteIcon from 'src/components/Helpers/GridDeleteIcon';
import CustomAgGridEditable from 'src/components/AgGridComponents/CustomAgGridEditable';
import ServiceDialog from './ServiceDialog';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { prepareDataForGrid } from 'src/constants/helpers';
import { getFrameworkComponents, genrateColoum } from 'src/constants/columns';
import { ExpandMore } from '@material-ui/icons';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { fetch_quotation_service_fields } from 'src/components/Quotation/helper';
import DateRangeIcon from '@material-ui/icons/DateRange';
import LeadTimeDialog from './LeadTimeDialog';

const Product = ({ quotationData, setNextStep, renderedFrom, stepFullScreen }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [selectedServiceData, setSelectedServiceData] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteQuotationService, setDeleteQuotationService] = useState([]);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [leadTimeDialog, setLeadTimeDialog] = useState({ open: false, data: null });

  useEffect(() => {
    fetchQuotationService();
  }, [quotationData]);

  useEffect(() => {
    fetchFields();
  }, []);

  const leadTimeColumn = {
    field: 'leadTime',
    headerName: 'Lead Time (Days)',
    // cellRenderer: 'commonRenderer',
    Cell: ({ row }) => (row.data['leadTime'] ? <p>ddddd</p> : <p>0</p>)
  };
  const fetchFields = async () => {
    const fields = await fetch_quotation_service_fields(quotationData?.currency);
    let rendererNames = [];
    genrateColoum(fields, columns, rendererNames, false, renderedFrom);
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      commonRenderer: CommonRenderer,
      actionsRenderer: ActionsRenderer,
      ...tempFrameworkComponent
    };
    setFrameWorkComponent({ ...tempFrameworkComponent });
    setColumns([...columns]);
  };
  console.log(columns);
  const columnState = JSON.parse(localStorage.getItem(renderedFrom));
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  const fetchQuotationService = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${quotation.api}/service/${quotationData._id}`)
      .then(({ data: { data } }) => {
        let rows = data?.map((item) => {
          let finalObject = prepareDataForGrid(item);
          // finalObject["isChecked"] = selectedRecords.some(s => s._id === item._id);
          // finalObject["canDelete"] = permissions?.quotation?.isDelete;
          // finalObject["allowedToEdit"] = permissions?.quotation?.isUpdate;
          let res: any = {
            ...finalObject
          };
          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: rows.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const ActionsRenderer = (params) => (
    <>
      <HtmlTooltip title="Edit">
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setShowServiceDialog(true);
            setSelectedServiceData(params.data);
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
            setLeadTimeDialog({ open: true, data: params.data });
          }}
        >
          <DateRangeIcon fontSize="small" color="primary" />
        </IconButton>
      </HtmlTooltip>
      <GridDeleteIcon
        hasDeletePermission={permissions?.quotation?.isUpdate}
        ownerId={user?.user?._id}
        userId={user?.user?._id}
        onDelete={() => {
          setShowDeleteConfirmBox(true);
          setDeleteQuotationService([params.data._id]);
        }}
        entity="rentalManagement"
      />
    </>
  );

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleAddService = (rows) => {
    axiosInstance()
      .post(`${quotation.api}/service/${quotationData._id}/add`, { services: rows })
      .then(() => {
        fetchQuotationService();
        setShowServiceDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateService = (rows) => {
    axiosInstance()
      .put(`${quotation.api}/service/${quotationData._id}/update`, { services: rows })
      .then(() => {
        fetchQuotationService();
        setShowServiceDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .post(`${quotation.api}/service/${quotationData._id}/delete`, { ids: deleteQuotationService })
      .then(() => {
        fetchQuotationService();
        setShowDeleteConfirmBox(false);
        setDeleteQuotationService([]);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
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
              >
                {' '}
                {'Actions'} <ExpandMore />
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
      {columns && frameWorkComponent ? (
        isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions.quotation}
            primaryField={columns?.find((d) => d.field === 'description')}
            onClick={(data) => {
              setShowServiceDialog(true);
              setSelectedServiceData(data);
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(data) => {
              setShowServiceDialog(true);
              setSelectedServiceData(data);
            }}
            extraParamsToCheckDelete={true}
            onDelete={(data) => {
              setShowDeleteConfirmBox(true);
              setDeleteQuotationService([data._id]);
            }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            chips={[
              {
                label: `Quantity: `,
                field: 'qty',
                forceShow: true
              }
            ]}
            onCreate={null}
            showClone={false}
            fullHeight={true}
            renderedFrom={renderedFrom}
            onClone={() => {}}
          />
        ) : (
          <CustomAgGridEditable
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameWorkComponent}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            allowAction={true}
            actionWidth={150}
            allowSelection={true}
            isClientSideGrid={true}
            loading={loading}
            onCellValueChanged={(row) => {
              //handleUpdateOrderProduct(row.data)
            }}
            renderedFrom={renderedFrom}
            refreshGrid={fetchQuotationService}
            currency={quotationData?.currency?.toLowerCase()}
          />
        )
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

export default Product;
