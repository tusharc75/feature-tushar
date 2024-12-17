import { IconButton, MenuItem } from '@material-ui/core';
import Box from '@material-ui/core/Box/Box';
import { Edit } from '@material-ui/icons';
import { Fragment, useContext, useEffect, useState, useRef } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import DeleteIcon from '@material-ui/icons/Delete';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import { flattenArray } from 'src/constants/columns';
import { ASSET_STATUS, CHILD_RESOURCE, REPAIR_JOB_STATUS, repairJob, sidebarResource } from 'src/constants/helpers';
import ManageSerializedAsset from 'src/pages/SerializedAsset/ManageSerializedAsset';
import AddSerializedAsset from '../../RentalManagement/SerializedAsset/AddSerializedAsset';
import ManageAssetDialog from './ManageAssetDialog';
import { FiExternalLink } from 'react-icons/fi';
import { useGetWalkmeInstance, useSetWalkmeData } from 'src/components/CustomIntro';
import { generateAddExistingSerialisedAsset, generateAddNewSerialisedAsset, generateEditSerialisedAsset } from '../walkmeSteps';
import { repairJobMessage } from 'src/constants/messageHelpers';

const SerializedAsset = ({
  repairJobData,
  setNextStep,
  setNextStepToolTip,
  updateJobStatus,
  renderedFrom,
  allowedToEdit,
  stepFullScreen,
  alloweOperation,
  fetchRepairJobData
}) => {
  const toastConfig = useContext(CustomToastContext);

  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false);
  const [addNewSerializedAssetDialog, setAddNewSerializedAssetDialog] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [okBtnLoading, setOkBtnLoading] = useState(false);
  const [columns, setColumns] = useState(null);
  const [isUpdating, setUpdating] = useState(false);
  const [allFields, setAllFields] = useState([]);
  const { setWalkmeData } = useSetWalkmeData();
  const walkmeInstance = useGetWalkmeInstance();
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [showEditAssetDialog, setShowEditAssetDialog] = useState({
    open: false,
    isBulkedit: false,
    data: null,
    selectedRecords: [],
    showSaveAndNext: false
  });

  const [showAssetRemoveConfirmationDialog, setShowAssetRemoveConfirmationDialog] = useState({ open: false, id: null, ids: [] });
  const [isRateRequired, setIsRateRequired] = useState(false);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    if (repairJobData) {
      fetchFields();
    }
  }, [repairJobData]);

  useEffect(() => {
    fetchRecords();
  }, [columns]);

  useEffect(() => {
    let stepData = [generateAddExistingSerialisedAsset(), generateAddNewSerialisedAsset()];
    if (dataRows?.length) {
      if (permissions?.repairJob?.isUpdate) {
        stepData.push(generateEditSerialisedAsset(false, 0));
      }
    }
    setWalkmeData(stepData);
  }, [dataRows]);

  const fetchFields = async () => {
    setColumns(null);
    let fields = await fetch_child_resource_fields_perm(CHILD_RESOURCE.repairJobAsset, repairJobData?.currency, true);
    fields = fields?.filter((f) => f?.isRead);

    const isPriceRequired = fields?.filter((el) => el.fieldName === 'price' && el.required).length > 0;
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

    setAllFields(JSON.parse(JSON.stringify(fields)));

    const assetField = data?.find((e) => e.resource === sidebarResource.serializedAsset)?.fieldNames || [];
    const productField = data?.find((e) => e.resource === sidebarResource.product)?.fieldNames || [];

    const newColumns = generateColumns(renderedFrom, fields, null, false, repairJobData?.currency || 'USD');
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 100,
        disableFilters: false,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      }
    ];
    assetField?.forEach((ele) => {
      if (ele?.fieldName === 'assetNumber') {
        coloum.push({
          accessor: 'assetNumber',
          Header: ele?.fieldLabel,
          sticky: 'none',
          width: 200,
          Cell: ({ row, table }) => (
            <div className="flex items-center gap-2">
              {row.original.assetNumber ? (
                <>
                  {allowedToEdit ? (
                    <p
                      className="link text-truncate"
                      onClick={() =>
                        setShowEditAssetDialog({
                          open: true,
                          isBulkedit: false,
                          data: row?.original,
                          selectedRecords: [],
                          showSaveAndNext:
                            row?.index < table.getRowModel().rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
                        })
                      }
                    >
                      {row.original.assetNumber}
                    </p>
                  ) : (
                    <p className="text-truncate">{row.original.assetNumber}</p>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.serializedAssetDetail.path}/${row.original._id}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </>
              ) : (
                <NoDataCell />
              )}
            </div>
          )
        });
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
        });
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
      });
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
    });
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) => (
        <div className="d-flex gap-1">
          {
            <HtmlTooltip title={permissions?.repairJob?.isUpdate ? 'Edit' : 'You are not permitted to edit'}>
              <IconButton
                disabled={!permissions?.repairJob?.isUpdate}
                color="primary"
                size="small"
                onClick={() => {
                  setShowEditAssetDialog({ open: true, isBulkedit: false, data: row?.original, selectedRecords: [], showSaveAndNext: false });
                }}
                id={`edit-button-${row.index || 0}`}
              >
                <Edit color="primary" fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          }
          {row?.original?.status === ASSET_STATUS.reserved && allowedToEdit && permissions?.repairJob?.isUpdate && (
            <HtmlTooltip title="Delete">
              <IconButton
                size="small"
                aria-label="Delete"
                onClick={() => {
                  setShowAssetRemoveConfirmationDialog({ open: true, id: row?.original?._id, ids: [] });
                }}
              >
                <DeleteIcon color="error" fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          )}
        </div>
      )
    });
    setColumns(coloum);
  };

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    setNextStep(false);
    setNextStepToolTip(null);
    var data: any = [];
    const response = await axiosInstance().get(`${repairJob.api}/${repairJobData._id}/assets`);
    data = response?.data?.data;
    data.forEach((parent, i) => {
      parent.index = i + 1;
      parent.productName = parent.product?.optionLabel;
      parent.productDescription = parent?.productDetail?.productDescription;
      parent.productCategory = parent?.productCategory?.optionLabel;
      parent.isValid = parent['finalPrice_' + repairJobData?.currency?.toLowerCase()] ? true : !isRateRequired;
      parent.hideSelection = parent.status === ASSET_STATUS.lost;
    });
    if (data.filter((_rows) => _rows.isValid === false).length > 0 || data.length === 0) {
      setNextStep(false);
      setNextStepToolTip(repairJobMessage.repairProcess);
    } else {
      setNextStep(true);
    }

    dispatch({ type: 'initialize', data: data, count: data?.length });
    dispatch({ type: 'loading', loading: false });
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
        fetchRepairJobData();
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

  const handleAdd = async (rows) => {
    setIsAdding(true);
    axiosInstance()
      .post(`${repairJob.api}/${repairJobData._id}/assets`, {
        assets: rows.map((m) => {
          return {
            _id: m._id ?? m.id,
            currentStatus: m?.status
          };
        })
      })
      .then(({ data }) => {
        setAddSerializedAssetDialog(false);
        setAddNewSerializedAssetDialog(false);
        if (repairJobData.status === REPAIR_JOB_STATUS.new) {
          updateJobStatus(REPAIR_JOB_STATUS.inProgress);
        }
        fetchRecords();
        fetchRepairJobData();
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
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${repairJob.api}/${repairJobData?._id}/assets`, { assets: rows })
      .then(({ data }) => {
        fetchRecords();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
          setShowEditAssetDialog({
            open: true,
            isBulkedit: false,
            data: dataRows[rowIndex + 1],
            selectedRecords: [],
            showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
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
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qtyDisplay')) {
      inputField['qty'] = inputField['qtyDisplay'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData, repairJobData?.currency);
    handleSaveData(rows);
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setAddSerializedAssetDialog(true);
          }}
          id={'add-existing-serialised-asset-menu-item'}
        >
          Add Existing {resources?.serializedAsset?.titlePlural}
        </MenuItem>
        {permissions?.serializedAsset?.isCreate && (
          <MenuItem
            onClick={() => {
              setAddNewSerializedAssetDialog(true);
            }}
            id={'add-new-serialised-asset-menu-item'}
          >
            Add New {resources?.serializedAsset?.titleSingular}
          </MenuItem>
        )}
      </>
    );
  };

  const actionButtonMenuitems = () => {
    return (
      <>
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
      </>
    );
  };

  return (
    <Fragment>
      {allowedToEdit && repairJobData?.status !== REPAIR_JOB_STATUS.completed && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={alloweOperation}
            addButtonMenuItems={addButtonMenuItems()}
            isActionButtonVisible={true}
            actionButtonMenuItems={actionButtonMenuitems()}
            actionButtonProps={{ disabled: selectedRecords.length === 0 }}
            hasXpadding
          />
        </>
      )}
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            hideSelection={!allowedToEdit}
            hideAction={!allowedToEdit}
            onSaveEdit={onSaveInlineEdit}
            refreshGrid={fetchRecords}
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
          addSerializedAsset={(rows) => {
            handleAdd(rows);
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
      {addNewSerializedAssetDialog && (
        <ManageSerializedAsset
          onClose={() => setAddNewSerializedAssetDialog(false)}
          referenceType={'repairJob'}
          referenceData={{
            warehouse: repairJobData?.warehouse?.optionValue
          }}
          onSuccess={(data) => {
            handleAdd([data]);
          }}
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
