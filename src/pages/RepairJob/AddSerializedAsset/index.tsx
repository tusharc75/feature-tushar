import { useState, useEffect, useContext, useMemo, Fragment, useReducer } from "react";
import Box from "@material-ui/core/Box/Box";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import routes from "../../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Chip, IconButton, Menu, MenuItem } from "@material-ui/core";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import AddSerializedAsset from "../../RentalManagement/SerializedAsset/AddSerializedAsset";
import { sidebarResource, INVENTORY_STATUS, CHILD_RESOURCE, REPAIR_JOB_STATUS, repairJob, prepareDataForGrid, gridLoadingTimeout } from "../../../constants/helpers";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { useHistory } from "react-router-dom";
import InfoIcon from '@material-ui/icons/Info';
import { isMobile, isTablet } from "react-device-detect";
import { useData } from "../../../StateProvider/Provider";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { getFrameworkComponents, genrateColoum } from '../../../constants/columns';
import { CommonRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import GridDeleteIcon from '../../../components/Helpers/GridDeleteIcon';
import { MdAdd, MdDelete } from 'react-icons/md';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { RiEditCircleLine, RiExchangeFundsLine } from 'react-icons/ri';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import ManageAssetDialog from './ManageAssetDialog';
import AssetScrapRepairDialog from '../../../components/AssetScrapRepairDialog/AssetScrapRepairDialog';

const SerializedAsset = ({ repairJobData, setNextStep, updateJobStatus, repairedAssetStatus, renderedFrom, allowedToEdit }) => {

  const [anchorEl, setAnchorEl] = useState(null);
  const toastConfig = useContext(CustomToastContext);

  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [okBtnLoading, setOkBtnLoading] = useState(false)
  const history = useHistory();

  const [frameWorkComponent, setFrameWorkComponent] = useState({})
  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState(null)
  const [state, dispatch] = useReducer(reducer, intialState);
  const { state: { user, permissions } }: any = useData();
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

  const [showEditAssetDialog, setShowEditAssetDialog] = useState({ open: false, asset: null, selectedRecords: [] })
  const [showAssetRemoveConfirmationDialog, setShowAssetRemoveConfirmationDialog] = useState({ open: false, id: null, ids: [] });
  const [serializedAssetFields, setSerializedAssetFields] = useState(null)
  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: "", message: "" })

  useEffect(() => {
    if (repairJobData) {
      fetchFields();
    }
  }, [repairJobData]);


  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const commonColumns = [
    { field: "assetNumber", headerName: "Asset Number", show: true, disabled: true, cellRenderer: "assetNumberRenderer", width: 300, required: false },
    { field: "productCategory", headerName: "Product Category", show: true, disabled: true, cellRenderer: "commonRenderer", required: false },
    { field: "product", headerName: "Product Type", show: true, cellRenderer: "commonRenderer", required: false },
    { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer", required: false },
  ];

  const fetchFields = () => {
    axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.repairJobAsset}`).then(({ data: { data } }) => {
      const columns = [...commonColumns];
      let rendererNames = [];
      genrateColoum(data, columns, rendererNames, false, renderedFrom);
      setSerializedAssetFields(data)
      let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
      tempFrameworkComponent = {
        assetNumberRenderer: AssetNumberRenderer,
        commonRenderer: CommonRenderer,
        actionsRenderer: ActionsRenderer,
        ...tempFrameworkComponent,
      }
      setFrameWorkComponent({ ...tempFrameworkComponent })
      setColumns([...columns])
      fetchRecords()
    })
  }

  const fetchRecords = () => {
    dispatch({ type: "loading", loading: true });
    dispatch({ type: "initialize", data: [], count: 0 });
    setNextStep(false)
    axiosInstance().get(`${repairJob.api}/${repairJobData._id}/assets`)
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          u["hideSelection"] = u.status === INVENTORY_STATUS.lost;
          let finalObject = prepareDataForGrid(u, user);
          finalObject["canDelete"] = false;
          finalObject["isChecked"] = false;
          finalObject["allowedToEdit"] = true;
          return finalObject;
        });
        if (rows.length) {
          setNextStep(true)
        }
        dispatch({ type: "initialize", data: [...rows], count: rows.length });
        setTimeout(() => { dispatch({ type: "loading", loading: false }); }, gridLoadingTimeout);
      }).catch((error) => {
        setAddSerializedAssetDialog(false)
        setIsAdding(false)
        toastConfig.setToastConfig(error)
      });
  }

  const AssetNumberRenderer = (params) => (
    <span className="d-flex gap-2 align-items-center">
      <span className="link cursor-pointer" onClick={() => setShowEditAssetDialog({ open: true, asset: params.data, selectedRecords: [] })}>
        {params.value}
      </span>
      <HtmlTooltip title="Details">
        <IconButton
          size="small"
          aria-label="Details"
          onClick={() => {
            window.open(`${routes.serializedAssetDetail.path}/${params.data._id}`);
          }}
        >
          <InfoIcon fontSize="small" />
        </IconButton>
      </HtmlTooltip>
      {
        params.data.repaired && <HtmlTooltip title="Repaired">
          <CheckCircleIcon color="primary" fontSize="small" />
        </HtmlTooltip>
      }
    </span>
  );

  const ActionsRenderer = (params) => (
    <div className="d-flex gap-1">
      {params.data?.status === INVENTORY_STATUS.reserved ? <GridDeleteIcon
        hasDeletePermission={permissions?.repairJob?.isUpdate}
        ownerId={user?.user?._id}
        userId={user?.user?._id}
        onDelete={() => {
          setShowAssetRemoveConfirmationDialog({ open: true, id: params.data._id, ids: [] });
        }}
        entity={sidebarResource.serializedAsset}
      /> : ""
      }
    </div>
  );

  const deleteRepairJobAssets = () => {
    setOkBtnLoading(true)
    axiosInstance().put(`${repairJob.api}/${repairJobData._id}/assets/remove`, { ids: showAssetRemoveConfirmationDialog.id ? [showAssetRemoveConfirmationDialog.id] : showAssetRemoveConfirmationDialog.ids })
      .then(({ data }) => {
        setOkBtnLoading(false);
        setShowAssetRemoveConfirmationDialog({ open: false, id: null, ids: [] });
        fetchRecords();
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        localStorage.setItem(`${selectedRecords}_selected`, JSON.stringify([]));
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
  }


  return (<Fragment>
    {allowedToEdit && repairJobData?.status !== REPAIR_JOB_STATUS.completed &&
      <Box display="flex" justifyContent="space-between" m={1}  >
        <Box display="flex">
          <Button
            variant={isMobile && !isTablet ? "text" : "contained"}
            color="primary"
            type="button"
            style={isMobile && !isTablet ? { color: "var(--secondary)" } : {}}
            size="small"
            onClick={() => {
              setAddSerializedAssetDialog(true)
            }}
          >
            {isMobile && !isTablet ? <MdAdd size={23} /> : `Add ${routes.serializedAsset.title}`}
          </Button>
        </Box>
        <Box display="flex" className="gap-2">
          {repairJobData && repairJobData["status"] !== REPAIR_JOB_STATUS.completed &&
            <Button
              variant={isMobile && !isTablet ? "text" : "outlined"}
              color="primary"
              aria-controls="simple-menu"
              aria-haspopup="true"
              disabled={selectedRecords.length === 0}
              size="small"
              style={isMobile && !isTablet ? { color: "var(--warning-darken)" } : {}}

              onClick={handleClick}
              endIcon={<ArrowDropDownIcon />}>
              {isMobile && !isTablet ? <RiExchangeFundsLine size={20} /> : "Change Status"}
            </Button>
          }
          <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => {
              setAnchorEl(null)
              setStatusToUpdate({ open: true, isUpdating: false, status: "Scrap", message: "" })
            }}>Scrap</MenuItem>
            <MenuItem onClick={() => {
              setAnchorEl(null)
              setStatusToUpdate({ open: true, isUpdating: false, status: "Lost", message: "" })
            }}>Lost</MenuItem>
          </Menu>
          <Button
            variant={isMobile && !isTablet ? "text" : "contained"}
            color="primary"
            type="button"
            style={isMobile && !isTablet ? { color: "var(--info-dark)" } : {}}
            size="small"
            disabled={selectedRecords.length === 0}
            onClick={() => {
              setShowEditAssetDialog({ open: true, asset: null, selectedRecords: selectedRecords })
            }}
          >
            {isMobile && !isTablet ? <RiEditCircleLine size={20} /> : "Bulk Edit"}
          </Button>
          <Button
            variant={isMobile && !isTablet ? "text" : "contained"}
            color="primary"
            style={isMobile && !isTablet ? { color: "red" } : {}}
            type="button"
            size="small"
            disabled={selectedRecords.length === 0 || selectedRecords.some(s => s.status !== INVENTORY_STATUS.reserved)}
            onClick={() => {
              setShowAssetRemoveConfirmationDialog({ open: true, id: null, ids: selectedRecords.map(m => m._id) });
            }}
          >
            {isMobile && !isTablet ? <MdDelete size={20} /> : "Delete"}
          </Button>
        </Box>
      </Box>
    }
    <Grid item xs={12} md={12} sm={12} className="mt-3">
      {columns && Object.keys(frameWorkComponent).length > 0 ?
        isMobile && !isTablet ?
          <CustomSwipableList
            allowSelection={allowedToEdit}
            allowSwipe={allowedToEdit}
            permissions={permissions}
            primaryField={columns?.find(d => d.field)}
            onClick={(data) => {
              setShowEditAssetDialog({ open: true, asset: data, selectedRecords: [] })
            }}
            dataRows={dataRows}
            selectedRecords={true}
            dispatch={dispatch}
            onEdit={(data) => {
              history.push(`${routes.rentalManagementDetail.path}/${data._id}?openEdit=true`)
            }}
            extraParamsToCheckDelete={true}
            onDelete={(data) => {
              setShowAssetRemoveConfirmationDialog({ open: true, id: data._id ?? data.id, ids: [] });
            }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            chips={[
              {
                label: "Product Desc. : ",
                field: "product",
              }
            ]}
            additionalDetails={[]}
            owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
            onCreate={false}
            showClone={false}
            onClone={() => { }}
            renderedFrom={renderedFrom}
          /> :
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameWorkComponent}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            allowAction={allowedToEdit && repairJobData && repairJobData["status"] !== REPAIR_JOB_STATUS.completed ? true : false}
            actionWidth={150}
            loading={loading}
            allowSelection={allowedToEdit && repairJobData && repairJobData["status"] !== REPAIR_JOB_STATUS.completed ? true : false}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            rowClassRules={{
              "red-data-row": function (params) {
                return [INVENTORY_STATUS.lost, INVENTORY_STATUS.scrap].some(s => s === params.data.status);
              },
            }}
            refreshGrid={fetchRecords}
          />
        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
      }
    </Grid>
    {addSerializedAssetDialog &&
      <AddSerializedAsset
        refrenceType="Repair Job"
        addSerializedAsset={(newRecordsToAdd) => {
          setIsAdding(true);
          axiosInstance().post(`${repairJob.api}/${repairJobData._id}/assets`, { "ids": newRecordsToAdd.map(m => m._id ?? m.id) })
            .then(({ data }) => {
              setAddSerializedAssetDialog(false)
              if (repairJobData.status === REPAIR_JOB_STATUS.new) {
                updateJobStatus(REPAIR_JOB_STATUS.inProgress)
              }
              fetchRecords();
              toastConfig.setToastConfig({
                open: true,
                type: "success",
                message: data.message,
              });
              setIsAdding(false)
            }).catch((error) => {
              setAddSerializedAssetDialog(false)
              setIsAdding(false)
              toastConfig.setToastConfig(error)
            });
        }}
        handleSerializedAssetClose={() => {
          setAddSerializedAssetDialog(false);
        }}
        isAdding={isAdding}
        selectedProducts={[]}
        filterByPlant={repairJobData.warehouse?.optionValue}
      />}
    {showAssetRemoveConfirmationDialog.open && (
      <ConfirmationDialog
        open={true}
        message={`Are you sure you want to delete ${showAssetRemoveConfirmationDialog.id ? "asset" : "selected assets"} ?`}
        onClose={() => {
          setShowAssetRemoveConfirmationDialog(prevState => ({ ...prevState, open: false }));
        }}
        onOk={deleteRepairJobAssets}
        okBtnLoading={okBtnLoading}
      />
    )}
    {showEditAssetDialog.open && (
      <ManageAssetDialog
        open={showEditAssetDialog.open}
        repairJobData={repairJobData}
        fields={serializedAssetFields}
        asset={showEditAssetDialog.asset}
        selectedRecords={showEditAssetDialog.selectedRecords}
        onClose={() => {
          setShowEditAssetDialog(prevState => {
            return {
              ...prevState,
              open: false
            }
          });
        }}
        onSuccess={() => {
          if (showEditAssetDialog.selectedRecords.length > 0) {
            localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
            dispatch({ type: "selection", selectedRecords: [] })
          }
          fetchRecords();
          setShowEditAssetDialog({
            open: false,
            asset: null,
            selectedRecords: [],
          });
        }}
      />
    )}
    {statusToUpdate.open && <AssetScrapRepairDialog
      statusToUpdate={statusToUpdate}
      setStatusToUpdate={setStatusToUpdate}
      selectedRecords={selectedRecords}
      id={repairJobData._id}
      onClose={() => {
        setStatusToUpdate(prevState => ({ ...prevState, open: false }))
      }}
      onSuccess={() => {
        fetchRecords();
        repairedAssetStatus([]);
      }}
    />
    }
  </Fragment>
  );
}
export default SerializedAsset;