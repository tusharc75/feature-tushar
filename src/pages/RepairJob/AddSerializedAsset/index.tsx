import { useState, useEffect, useContext, useMemo, Fragment, useReducer } from 'react';
import Box from '@material-ui/core/Box/Box';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import AddSerializedAsset from '../../RentalManagement/SerializedAsset/AddSerializedAsset';
import {
  sidebarResource,
  ASSET_STATUS,
  CHILD_RESOURCE,
  REPAIR_JOB_STATUS,
  repairJob,
  prepareDataForGrid,
  gridLoadingTimeout
} from 'src/constants/helpers';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { useHistory, Link } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import { useData } from 'src/StateProvider/Provider';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import { generateColoum } from 'src/constants/columns';
import { CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import GridDeleteIcon from 'src/components/Helpers/GridDeleteIcon';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import ManageAssetDialog from './ManageAssetDialog';
import AssetScrapRepairDialog from 'src/components/AssetScrapRepairDialog/AssetScrapRepairDialog';
import { Edit } from '@material-ui/icons';
import Tooltip from 'src/components/CustomTooltipTitle';
import useColumns, { getFrameworkComponents } from 'src/constants/useColumns';

const SerializedAsset = ({ repairJobData, setNextStep, updateJobStatus, repairedAssetStatus, renderedFrom, allowedToEdit, allowUpdateStatus }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorElAction, setAnchorElAction] = useState(null);
  const toastConfig = useContext(CustomToastContext);

  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [okBtnLoading, setOkBtnLoading] = useState(false);
  const history = useHistory();

  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const {
    state: { user, permissions }
  }: any = useData();
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

  const [showEditAssetDialog, setShowEditAssetDialog] = useState({ open: false, isBulkedit: false, inventory: null, selectedRecords: [] });
  const [showAssetRemoveConfirmationDialog, setShowAssetRemoveConfirmationDialog] = useState({ open: false, id: null, ids: [] });
  const [repairJobAssetFields, setRepairJobAssetFields] = useState(null);
  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: '', message: '' });
  const { getColumnData } = useColumns();

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

  const handleClickAction = (event) => {
    setAnchorElAction(event.currentTarget);
  };

  const handleCloseAction = () => {
    setAnchorElAction(null);
  };

  const fetchFields = async () => {
    var columns = [];
    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: 'Product',
          fieldNames: ['productName', 'productDescription', 'productCategory']
        },
        {
          resource: 'Serialized Asset',
          fieldNames: ['assetNumber', 'serialNumber']
        }
      ]
    });
    const assetField = data?.find((e) => e.resource === 'Serialized Asset')?.fieldNames || [];
    const productField = data?.find((e) => e.resource === 'Product')?.fieldNames || [];

    assetField?.forEach((ele) => {
      if (ele?.fieldName === 'assetNumber') {
        columns.push({ field: 'assetNumber', headerName: ele?.fieldLabel, show: true, disabled: true, cellRenderer: 'assetNumberRenderer' });
      }
      if (ele?.fieldName === 'serialNumber') {
        columns.push({ field: 'serialNumber', headerName: ele?.fieldLabel, show: true, cellRenderer: 'commonRenderer' });
      }
    });
    productField?.forEach((ele) => {
      columns.push({ field: ele?.fieldName, headerName: ele?.fieldLabel, show: true, cellRenderer: 'commonRenderer' });
    });

    columns.push({ field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer', required: false });

    const fieldResponce = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.repairJobAsset}`);

    let rendererNames = [];
    generateColoum(fieldResponce?.data?.data, columns, rendererNames, false, renderedFrom, getColumnData);
    setRepairJobAssetFields(fieldResponce?.data?.data);
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      assetNumberRenderer: AssetNumberRenderer,
      commonRenderer: CommonRenderer,
      actionsRenderer: ActionsRenderer,
      ...tempFrameworkComponent
    };
    setFrameWorkComponent({ ...tempFrameworkComponent });
    setColumns([...columns]);
    fetchRecords();
  };

  const fetchRecords = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'initialize', data: [], count: 0 });
    setNextStep(false);
    axiosInstance()
      .get(`${repairJob.api}/${repairJobData._id}/assets`)
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          u['hideSelection'] = u.status === ASSET_STATUS.lost;
          let finalObject = prepareDataForGrid(u, user);
          finalObject['allowedToEdit'] = allowedToEdit && permissions?.repairJob?.isUpdate;
          finalObject['canDelete'] = u?.status === ASSET_STATUS.reserved;
          finalObject['isChecked'] = false;
          finalObject['productName'] = u?.product?.optionLabel;
          finalObject['productDescription'] = u?.productDetail?.productDescription;
          finalObject['isChecked'] = false;
          return finalObject;
        });
        if (rows.length) {
          setNextStep(true);
        }
        dispatch({ type: 'initialize', data: [...rows], count: rows.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        setAddSerializedAssetDialog(false);
        setIsAdding(false);
        toastConfig.setToastConfig(error);
      });
  };

  const AssetNumberRenderer = (params) => (
    <p title={params.value} onClick={() => window.open(`${routes.serializedAssetDetail.path}/${params.data._id}`)} className="link cursor-pointer">
      {params.value}
    </p>
  );

  const ActionsRenderer = (params) => (
    <div className="d-flex gap-1">
      {
        <Tooltip title={permissions?.repairJob?.isUpdate ? 'Edit' : 'You are not permitted to edit'}>
          <IconButton
            disabled={!permissions?.repairJob?.isUpdate}
            color="primary"
            size="small"
            onClick={() => setShowEditAssetDialog({ open: true, isBulkedit: false, inventory: params.data.inventory, selectedRecords: [] })}
          >
            <Edit />
          </IconButton>
        </Tooltip>
      }
      {params.data?.status === ASSET_STATUS.reserved ? (
        <GridDeleteIcon
          hasDeletePermission={permissions?.repairJob?.isUpdate}
          ownerId={user?.user?._id}
          userId={user?.user?._id}
          onDelete={() => {
            setShowAssetRemoveConfirmationDialog({ open: true, id: params.data._id, ids: [] });
          }}
          entity={sidebarResource.serializedAsset}
        />
      ) : (
        ''
      )}
    </div>
  );

  const deleteRepairJobAssets = () => {
    setOkBtnLoading(true);
    axiosInstance()
      .put(`${repairJob.api}/${repairJobData._id}/assets/remove`, {
        ids: showAssetRemoveConfirmationDialog.id ? [showAssetRemoveConfirmationDialog.id] : showAssetRemoveConfirmationDialog.ids
      })
      .then(({ data }) => {
        setOkBtnLoading(false);
        setShowAssetRemoveConfirmationDialog({ open: false, id: null, ids: [] });
        fetchRecords();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        localStorage.setItem(`${selectedRecords}_selected`, JSON.stringify([]));
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      {allowedToEdit && repairJobData?.status !== REPAIR_JOB_STATUS.completed && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={isMobile && !isTablet ? 'outlined' : 'contained'}
            color="primary"
            type="button"
            style={isMobile && !isTablet ? { color: 'var(--secondary)' } : {}}
            size="small"
            onClick={() => {
              setAddSerializedAssetDialog(true);
            }}
          >
            {isMobile && !isTablet ? `Add  ${routes.serializedAsset.title}` : `Add ${routes.serializedAsset.title}`}
          </Button>
          {repairJobData && repairJobData['status'] !== REPAIR_JOB_STATUS.completed && (
            <Button
              variant={'outlined'}
              color="primary"
              aria-controls="simple-menu"
              aria-haspopup="true"
              disabled={selectedRecords.length === 0 || !allowUpdateStatus}
              size="small"
              onClick={handleClick}
              endIcon={<ArrowDropDownIcon />}
            >
              {'Change Status'}
            </Button>
          )}
          <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
          >
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setStatusToUpdate({ open: true, isUpdating: false, status: ASSET_STATUS.scrap, message: '' });
              }}
            >
              {ASSET_STATUS.scrap}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setStatusToUpdate({ open: true, isUpdating: false, status: ASSET_STATUS.lost, message: '' });
              }}
            >
              {ASSET_STATUS.lost}
            </MenuItem>
          </Menu>
          <div className="ml-auto"></div>
          <Button
            variant={'outlined'}
            color="primary"
            disabled={selectedRecords.length === 0}
            size="small"
            onClick={handleClickAction}
            endIcon={<ArrowDropDownIcon />}
            className="new-dropdown-v1"
          >
            Actions
          </Button>
          <Menu
            id="simple-menu"
            anchorEl={anchorElAction}
            keepMounted
            open={Boolean(anchorElAction)}
            onClose={handleCloseAction}
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
          >
            <MenuItem
              disabled={selectedRecords.length === 0}
              onClick={() => {
                setShowEditAssetDialog({ open: true, isBulkedit: true, inventory: null, selectedRecords: selectedRecords });
              }}
            >
              {'Bulk Edit'}
            </MenuItem>
            <MenuItem
              disabled={selectedRecords.length === 0 || selectedRecords.some((s) => s.status !== ASSET_STATUS.reserved)}
              onClick={() => {
                setShowAssetRemoveConfirmationDialog({ open: true, id: null, ids: selectedRecords.map((m) => m._id) });
              }}
            >
              {'Delete'}
            </MenuItem>
          </Menu>
        </div>
      )}
      <Grid item xs={12} md={12} sm={12}>
        {columns && Object.keys(frameWorkComponent).length > 0 ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={allowedToEdit}
              allowSwipe={allowedToEdit}
              permissions={{ isCreate: false, isUpdate: true, isDelete: true }}
              primaryField={columns?.find((d) => d.field)}
              onClick={(data) => {
                history.push(`${routes.serializedAssetDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={true}
              dispatch={dispatch}
              onEdit={(data) => {
                setShowEditAssetDialog({ open: true, isBulkedit: false, inventory: data.inventory, selectedRecords: [] });
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
                  label: 'Product Type : ',
                  field: 'product'
                }
              ]}
              additionalDetails={[]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={false}
              onClone={() => {}}
              renderedFrom={renderedFrom}
            />
          ) : (
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
              allowAction={allowedToEdit && repairJobData && repairJobData['status'] !== REPAIR_JOB_STATUS.completed ? true : false}
              actionWidth={150}
              loading={loading}
              allowSelection={allowedToEdit && repairJobData && repairJobData['status'] !== REPAIR_JOB_STATUS.completed ? true : false}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              rowClassRules={{
                'red-data-row': function (params) {
                  return [ASSET_STATUS.lost, ASSET_STATUS.scrap].some((s) => s === params.data.status);
                }
              }}
              refreshGrid={fetchRecords}
            />
          )
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {addSerializedAssetDialog && (
        <AddSerializedAsset
          referenceType="Repair Job"
          addSerializedAsset={(newRecordsToAdd) => {
            setIsAdding(true);
            axiosInstance()
              .post(`${repairJob.api}/${repairJobData._id}/assets`, {
                assets: newRecordsToAdd.map((m) => {
                  return {
                    _id: m._id ?? m.id,
                    currentStatus: m?.status
                  };
                })
              })
              .then(({ data }) => {
                setAddSerializedAssetDialog(false);
                if (repairJobData.status === REPAIR_JOB_STATUS.new) {
                  updateJobStatus(REPAIR_JOB_STATUS.inProgress);
                }
                fetchRecords();
                toastConfig.setToastConfig({
                  open: true,
                  type: 'success',
                  message: data.message
                });
                setIsAdding(false);
              })
              .catch((error) => {
                setIsAdding(false);
                toastConfig.setToastConfig(error);
              });
          }}
          handleSerializedAssetClose={() => {
            setAddSerializedAssetDialog(false);
          }}
          isAdding={isAdding}
          selectedProducts={[]}
          filterByPlant={repairJobData.warehouse?.optionValue}
        />
      )}
      {showAssetRemoveConfirmationDialog.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete ${showAssetRemoveConfirmationDialog.id ? 'asset' : 'selected assets'} ?`}
          onClose={() => {
            setShowAssetRemoveConfirmationDialog((prevState) => ({ ...prevState, open: false }));
          }}
          onOk={deleteRepairJobAssets}
          okBtnLoading={okBtnLoading}
        />
      )}
      {showEditAssetDialog.open && (
        <ManageAssetDialog
          repairJobData={repairJobData}
          repairJobAssetFields={repairJobAssetFields}
          isBulkedit={showEditAssetDialog.isBulkedit}
          onClose={() => {
            setShowEditAssetDialog({ open: false, isBulkedit: false, inventory: null, selectedRecords: [] });
          }}
          onSuccess={() => {
            if (showEditAssetDialog.selectedRecords.length > 0) {
              localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
              dispatch({ type: 'selection', selectedRecords: [] });
            }
            fetchRecords();
            setShowEditAssetDialog({ open: false, isBulkedit: false, inventory: null, selectedRecords: [] });
          }}
          inventory={showEditAssetDialog.inventory}
          selectedRecords={showEditAssetDialog.selectedRecords}
        />
      )}
      {statusToUpdate.open && (
        <AssetScrapRepairDialog
          statusToUpdate={statusToUpdate}
          setStatusToUpdate={setStatusToUpdate}
          selectedRecords={selectedRecords}
          id={repairJobData._id}
          onClose={() => {
            setStatusToUpdate((prevState) => ({ ...prevState, open: false }));
          }}
          onSuccess={() => {
            fetchRecords();
            repairedAssetStatus([]);
          }}
        />
      )}
    </Fragment>
  );
};
export default SerializedAsset;
