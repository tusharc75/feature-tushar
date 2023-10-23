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
import { Edit } from '@material-ui/icons';
import Tooltip from 'src/components/CustomTooltipTitle';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { calculateRowsFieldNew } from 'src/components/RentalManagment/helper';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';

const SerializedAsset = ({ repairJobData, setNextStep, updateJobStatus, renderedFrom, allowedToEdit, stepFullScreen }) => {

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
  const [showEditAssetDialog, setShowEditAssetDialog] = useState({ open: false, isBulkedit: false, data: null, selectedRecords: [], showSaveAndNext: false });

  const [showAssetRemoveConfirmationDialog, setShowAssetRemoveConfirmationDialog] = useState({ open: false, id: null, ids: [] });
  const [isRateRequired, setIsRateRequired] = useState(false);

  useEffect(() => {
    if (repairJobData) {
      fetchFields();
    }
  }, [repairJobData]);

  useEffect(() => {
    fetchRecords();
  }, [columns]);

  const handleClickAction = (event) => {
    setAnchorElAction(event.currentTarget);
  };

  const handleCloseAction = () => {
    setAnchorElAction(null);
  };

  const fetchFields = async () => {
    setColumns(null)
    const fieldResponce = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.repairJobAsset}`);
    const repairJobAssetFields = fieldResponce?.data?.data;

    const isPriceRequired = repairJobAssetFields?.filter((el) => el.fieldName === 'price' && el.required).length > 0;
    setIsRateRequired(isPriceRequired);

    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: sidebarResource.product,
          fieldNames: ['productName', 'productDescription', 'productCategory']
        },
        {
          resource: sidebarResource.serializedAsset,
          fieldNames: ['assetNumber', 'serialNumber']
        }
      ]
    });

    let fields = CURReplaceByCurrencySingle(repairJobAssetFields, repairJobData?.currency || "USD");
    setAllFields(JSON.parse(JSON.stringify(fields)));

    const assetField = data?.find((e) => e.resource === sidebarResource.serializedAsset)?.fieldNames || [];
    const productField = data?.find((e) => e.resource === sidebarResource.product)?.fieldNames || [];

    const newColumns = generateCustomTableColumns(fields, repairJobData?.currency || 'USD', renderedFrom);
    let coloum: any = [
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
          Cell: ({ row, rows }) => (
            <>
              {row.original.assetNumber ? (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {allowedToEdit ?
                    <p
                      className="link text-truncate"
                      onClick={() => setShowEditAssetDialog({ open: true, isBulkedit: false, data: row?.original, selectedRecords: [], showSaveAndNext: row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false })}
                    >{row.original.assetNumber}</p>
                    :
                    <p className="text-truncate">{row.original.assetNumber}</p>
                  }
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
      minWidth: 50,
      width: 50,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) =>
        <div className="d-flex gap-1">
          {<Tooltip title={permissions?.repairJob?.isUpdate ? 'Edit' : 'You are not permitted to edit'}>
            <IconButton
              disabled={!permissions?.repairJob?.isUpdate}
              color="primary"
              size="small"
              onClick={() => {
                setShowEditAssetDialog({ open: true, isBulkedit: false, data: row?.original, selectedRecords: [], showSaveAndNext: false })
              }
              }
            >
              <Edit />
            </IconButton>
          </Tooltip>}
          {row?.original?.status === ASSET_STATUS.reserved && (
            <GridDeleteIcon
              hasDeletePermission={permissions?.repairJob?.isUpdate}
              ownerId={user?.user?._id}
              userId={user?.user?._id}
              onDelete={() => {
                setShowAssetRemoveConfirmationDialog({ open: true, id: row?.original?._id, ids: [] });
              }}
              entity={sidebarResource.serializedAsset}
            />
          )}
        </div>
    });
    setColumns(coloum)
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
      parent.isValid = parent['finalPrice_' + repairJobData?.currency?.toLowerCase()] ? true : !isRateRequired;
      parent.hideSelection = parent.status === ASSET_STATUS.lost;
    });
    if (data.filter((_rows) => _rows.isValid === false).length > 0 || data.length === 0) {
      setNextStep(false);
    } else {
      setNextStep(true);
    }
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
        fetchRecords();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const rowIndex = rowsData.findIndex((d) => d._id === rows[0]?._id);
          setShowEditAssetDialog({
            open: true,
            isBulkedit: false,
            data: rowsData[rowIndex + 1],
            selectedRecords: [],
            showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false
          });
        } else {
          setShowEditAssetDialog({ open: false, isBulkedit: false, data: null, selectedRecords: [], showSaveAndNext: false });
        }
        setUpdating(false);
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
        <Box display="flex" justifyContent="space-between" flexWrap={'wrap'} gridGap={1} m={1}>
          <Box display="flex" flexWrap={'wrap'}>
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
              {`Add Existing  ${routes.serializedAsset.title}`}
            </Button>
          </Box>
          <Box display="flex" gridGap={2} >
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
                  setShowEditAssetDialog({ open: true, isBulkedit: true, data: null, selectedRecords: selectedRecords, showSaveAndNext: false });
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
          </Box>
        </Box>
      )}
      {columns && rowsData ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
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
          chartOfAccount={repairJobData?.chartOfAccount}
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
          allFields={allFields}
          onClose={() => {
            setShowEditAssetDialog({ open: false, isBulkedit: false, data: null, selectedRecords: [], showSaveAndNext: false });
          }}
          handleSaveData={handleSaveData}
          loadingEdit={isUpdating}
          isBulkedit={showEditAssetDialog.isBulkedit}
          data={showEditAssetDialog.data}
          selectedRecords={showEditAssetDialog.selectedRecords}
          showSaveAndNext={showEditAssetDialog.showSaveAndNext}
        />
      )}
    </Fragment>
  );
};
export default SerializedAsset;
