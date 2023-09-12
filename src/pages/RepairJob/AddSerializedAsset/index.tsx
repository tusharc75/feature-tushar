import { useState, useEffect, useContext, Fragment } from 'react';
import Box from '@material-ui/core/Box/Box';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
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
} from 'src/constants/helpers';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { useData } from 'src/StateProvider/Provider';
import { flattenArray, generateCustomTableColumns } from 'src/constants/columns';
import GridDeleteIcon from 'src/components/Helpers/GridDeleteIcon';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ManageAssetDialog from './ManageAssetDialog';
import AssetScrapRepairDialog from 'src/components/AssetScrapRepairDialog/AssetScrapRepairDialog';
import { Edit } from '@material-ui/icons';
import Tooltip from 'src/components/CustomTooltipTitle';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { calculateRowsFieldNew } from 'src/components/RentalManagment/helper';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';

const SerializedAsset = ({ repairJobData, setNextStep, updateJobStatus, repairedAssetStatus, renderedFrom, allowedToEdit, allowUpdateStatus }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorElAction, setAnchorElAction] = useState(null);
  const toastConfig = useContext(CustomToastContext);

  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [okBtnLoading, setOkBtnLoading] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [rowsData, setRowsData] = useState(null);
  const [columns, setColumns] = useState(null);
  const [isUpdating, setUpdating] = useState(false);
  const [allFields, setAllFields] = useState([]);
  const {
    state: { user, permissions }
  }: any = useData();
  const [showEditAssetDialog, setShowEditAssetDialog] = useState({ open: false, isBulkedit: false, inventory: null, selectedRecords: [] });
  const [showAssetRemoveConfirmationDialog, setShowAssetRemoveConfirmationDialog] = useState({ open: false, id: null, ids: [] });
  const [repairJobAssetFields, setRepairJobAssetFields] = useState(null);
  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: '', message: '' });


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
    const fieldResponce = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.repairJobAsset}`);
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

    let fields = CURReplaceByCurrencySingle(fieldResponce?.data?.data, repairJobData?.currency || "USD");
    setAllFields(fields);
    setRepairJobAssetFields(fields);
    const assetField = data?.find((e) => e.resource === 'Serialized Asset')?.fieldNames || [];
    const productField = data?.find((e) => e.resource === 'Product')?.fieldNames || [];

    const newColumns = generateCustomTableColumns(fields, repairJobData?.currency || 'USD', renderedFrom);
    let coloum:any = [
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
    ];
    assetField?.forEach((ele) => {
      if (ele?.fieldName === 'assetNumber') {
        coloum.push({
          accessor: 'assetNumber',
          Header: ele?.fieldLabel,
          sticky: 'none',
          width: 200,
          Cell: ({ row }) => (
            <>
              {row.original.assetNumber ? (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <p 
                  className="link text-truncate"
                  onClick={() =>  setShowEditAssetDialog({ open: true, isBulkedit: false, inventory: row?.original?.inventory, selectedRecords: [] }) }
                  >{row.original.assetNumber}</p>
                  <Box ml={1}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        window.open(`${routes.serializedAssetDetail.path}/${row.original._id}`)
                      }}
                    >
                      <OpenInNewIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Box>
                </div>
              ) :
                (
                  <NoDataCell />
                )
              }
            </>
          )
        })
      }
      if (ele?.fieldName === 'serialNumber') {
        coloum.push({
          accessor: 'serialNumber',
          Header: ele?.fieldLabel,
          sticky: 'none',
          width: 200,
          Cell: ({ row }) => (
            <>
            {row.original.serialNumber ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
              <p className="text-truncate">{row.original.serialNumber}</p>
            </div>
            ) : (
              <NoDataCell />
            )}
            </>

          )
        })
      }
    });
    productField?.forEach((ele) => {
      coloum.push({
        accessor: ele?.fieldName,
        Header: ele?.fieldLabel,
        sticky: 'none',
        width: 200,
        Cell: ({ row }) => (
          <>
            {row.original[ele?.fieldName] ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p className="text-truncate">{row.original[ele?.fieldName]}</p>
              </div>
            ) : (
              <NoDataCell />
            )}
          </>
        )
      })
    });
    coloum.push({
      accessor: 'status',
      Header: 'Status',
      sticky: 'none',
      width: 100,
      Cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <p className="text-truncate">{row.original.status}</p>
        </div>
      )
    })
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      width: 100,
      sticky: 'right',
      Cell: ({ row }) =>
        <div className="d-flex gap-1">
          {
            <Tooltip title={permissions?.repairJob?.isUpdate ? 'Edit' : 'You are not permitted to edit'}>
              <IconButton
                disabled={!permissions?.repairJob?.isUpdate}
                color="primary"
                size="small"
                onClick={() => {
                  setShowEditAssetDialog({ open: true, isBulkedit: false, inventory: row?.original?.inventory, selectedRecords: [] })
                }
                }
              >
                <Edit />
              </IconButton>
            </Tooltip>
          }
          {row?.original?.status === ASSET_STATUS.reserved ? (
            <GridDeleteIcon
              hasDeletePermission={permissions?.repairJob?.isUpdate}
              ownerId={user?.user?._id}
              userId={user?.user?._id}
              onDelete={() => {
                setShowAssetRemoveConfirmationDialog({ open: true, id: row?.original?._id, ids: [] });
              }}
              entity={sidebarResource.serializedAsset}
            />
          ) : (
            ''
          )}
        </div>

    });
    setColumns(coloum)
    fetchRecords();
  };

  const fetchRecords = async () => {
    setNextStep(false);
    var data: any = [];
    const response = await axiosInstance().get(`${repairJob.api}/${repairJobData._id}/assets`)
    data = response?.data?.data;
    data.forEach((parent, i) => {
      parent.index = i + 1;
      parent.productName = parent.product?.optionLabel
      parent.productDescription = parent?.productDetail?.productDescription
      parent.productCategory = parent?.productCategory?.optionLabel
      parent.isValid = parent.status === ASSET_STATUS.scrap || parent.status === ASSET_STATUS.lost ? false : true
      parent.hideSelection = parent.status === ASSET_STATUS.lost;
    });
    setNextStep(true);
    setRowsData(data);
    setSelectedRecords([]);
  };

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
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
    .put(`${repairJob.api}/${repairJobData?._id}/assets`, rows)
      .then(({ data }) => {
        setUpdating(false);
        fetchRecords();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowEditAssetDialog({ open: false, isBulkedit: false, inventory: null, selectedRecords: [] });
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };


  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(rowsData)?.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qtyDisplay')) {
      inputField['qty'] = inputField['qtyDisplay'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsFieldNew(flattenArray(rowsData), inputField, allFields, updatedData);
    
   handleSaveData(rows);
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
            {isMobile && !isTablet ? `Add Existing  ${routes.serializedAsset.title}` : `Add Existing ${routes.serializedAsset.title}`}
          </Button>
          <div className="ml-auto"></div>
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
      {columns && rowsData ? (
        <>
          <Box mt={1} p="6px" zIndex={5} width={'100%'}>
            <CustomReactTable
              height={'calc(100vh - 345px)'}
              columns={columns}
              data={rowsData}
              setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
              onSelect={setSelectedRecords}
              childrenProperty="subRows"
              uniqueKey="_id"
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
              onSaveEdit={onSaveInlineEdit}
              hideExpander={true}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
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
                    currentStatus: m?.status,
                    qty: 1,
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
          filterByPlant={repairJobData.warehouse}
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
          inventory={showEditAssetDialog.inventory}
          selectedRecords={showEditAssetDialog.selectedRecords}
          handleSaveData={handleSaveData}
          loadingEdit={isUpdating}
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
