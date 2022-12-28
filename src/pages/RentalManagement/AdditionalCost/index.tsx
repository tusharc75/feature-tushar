import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Grid, Box, Button, Paper, Typography, IconButton, Tab, Tabs, ButtonGroup, Container, InputAdornment, TextField } from '@material-ui/core';
import { Autocomplete, Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { rentalManagement } from '../../../constants/helpers';
import EditIcon from '@material-ui/icons/Edit';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, DateRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import GridDeleteIcon from '../../../components/Helpers/GridDeleteIcon';
import CustomAgGridEditable from '../../../components/AgGridComponents/CustomAgGridEditable';
import AdditionalCostDialog from './AdditionalCostDialog';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import { prepareDataForGrid } from '../../../constants/helpers';
import { getColumnData, getStaticFields, getFrameworkComponents, getSortedColumns, genrateColoum } from '../../../constants/columns';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { fetch_rental_cost_fields } from '../../../components/RentalManagment/helper';

const AdditionalCost = ({ rentalManagementData, setNextStep, renderedFrom, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const [showCostDialog, setShowCostDialog] = useState(false);
  const [selectedCostData, setSelectedCostData] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);
  const fetchFields = async () => {
    setNextStep(false);
    const fields = await fetch_rental_cost_fields(rentalManagementData.currency, isOffline);
    let rendererNames = [];
    genrateColoum(fields, columns, rendererNames, false, renderedFrom);
    columns?.forEach((ele) => {
      if (ele.field === 'costType') {
        ele.cellRenderer = 'costTypeRenderer';
      }
    });
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      commonRenderer: CommonRenderer,
      costTypeRenderer: CostTypeRenderer,
      actionsRenderer: ActionsRenderer,
      ...tempFrameworkComponent
    };
    setFrameWorkComponent({ ...tempFrameworkComponent });
    //column array 2 to last element
    const tempColumns = columns.slice(2);

    setColumns([...columns]);
    fetchAdditionalCost();
    setNextStep(false);
  };

  const fetchAdditionalCost = async () => {
    setNextStep(false);
    try {
      dispatch({ type: 'loading', loading: true });
      if (gridApi) {
        gridApi.setRowData([]);
      }
      var data: any = [];
      if (isOffline) {
        data = await findOne(objectStore.rentalManagement, rentalManagementData._id);
        data = data?.additionalCost;
      } else {
        const response = await axiosInstance().get(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}`);
        data = response?.data?.data;
      }
      let rows = data?.map((item) => {
        let res: any = {
          ...prepareDataForGrid(item)
        };
        res['canDelete'] = permissions?.rentalManagement?.isUpdate && allowedToEdit;
        res['allowedToEdit'] = permissions?.rentalManagement?.isUpdate && allowedToEdit;
        res['isChecked'] = false;
        return res;
      });
      setNextStep(true);
      dispatch({ type: 'initialize', data: rows, count: rows.length });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const ActionsRenderer = (params) =>
    !isOffline && (
      <Fragment>
        <HtmlTooltip title="Edit">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowCostDialog(true);
              setSelectedCostData(params.data);
            }}
          >
            <EditIcon color="primary" />
          </IconButton>
        </HtmlTooltip>
        <GridDeleteIcon
          hasDeletePermission={permissions?.rentalManagement?.isUpdate && allowedToEdit}
          ownerId={user?.user?._id}
          userId={user?.user?._id}
          onDelete={() => {
            setDeleteData([params.data._id]);
          }}
          entity="rentalManagement"
        />
      </Fragment>
    );

  const CostTypeRenderer = (params) =>
    params?.value ? (
      allowedToEdit ? (
        <a
          className="link"
          title={params.value}
          onClick={() => {
            setShowCostDialog(true);
            setSelectedCostData(params.data);
          }}
        >
          {params.value}
        </a>
      ) : (
        params.value
      )
    ) : (
      <NoDataCell />
    );

  const handleAddCost = (rows) => {
    axiosInstance()
      .post(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/add`, { additionalCost: rows })
      .then(() => {
        fetchAdditionalCost();
        setShowCostDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateCost = (rows) => {
    axiosInstance()
      .put(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/update`, { additionalCost: rows })
      .then(() => {
        fetchAdditionalCost();
        setShowCostDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (ids) => {
    setDeleting(true);
    axiosInstance()
      .post(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/delete`, { ids })
      .then(() => {
        fetchAdditionalCost();
        setDeleting(false);
        setDeleteData(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <Box display="flex" justifyContent="space-between" m={1}>
          <Box display="flex">
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={isOffline}
              onClick={() => {
                setShowCostDialog(true);
                setSelectedCostData(null);
              }}
            >
              Add
            </Button>
          </Box>
          <Box display="flex-end">
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={isOffline || selectedRecords.length === 0}
              onClick={() => {
                setDeleteData(selectedRecords?.map(({ _id }: any) => _id));
              }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      )}
      {columns && frameWorkComponent ? (
        isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={allowedToEdit}
            allowSwipe={true}
            permissions={permissions.rentalManagement}
            primaryField={columns?.find((d) => d.field)}
            onClick={(data) => {
              if (allowedToEdit) {
                setShowCostDialog(true);
                setSelectedCostData(data);
              }
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(data) => {
              setShowCostDialog(true);
              setSelectedCostData(data);
            }}
            extraParamsToCheckDelete={true}
            onDelete={(data) => {
              setDeleteData([data._id]);
            }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            chips={[
              {
                label: `Description: `,
                field: 'description'
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
            allowAction={allowedToEdit}
            actionWidth={150}
            allowSelection={allowedToEdit}
            isClientSideGrid={true}
            loading={loading}
            onCellValueChanged={(row) => {
              const newData = { ...row.data };
              const currency = rentalManagementData?.currency?.toLowerCase();
              newData[`price_${currency}`] = parseFloat(newData[`price_${currency}`]);
              newData[`finalPrice_${currency}`] = parseFloat(newData[`price_${currency}`]);
              
              delete newData.allowedToEdit;
              delete newData.canDelete;
              delete newData.id;
              delete newData.isChecked;
              handleUpdateCost([newData]);
            }}
            renderedFrom={renderedFrom}
            refreshGrid={fetchAdditionalCost}
            isFooter={true}
            currency={rentalManagementData?.currency?.toLowerCase()}
          />
        )
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
          currency={rentalManagementData?.currency}
          costData={selectedCostData}
        />
      )}
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete the record(s)?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}
    </Fragment>
  );
};

export default AdditionalCost;
