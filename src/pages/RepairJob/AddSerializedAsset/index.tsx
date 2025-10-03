import { IconButton, MenuItem } from '@mui/material';
import Box from '@mui/material/Box/Box';
import { Edit } from '@mui/icons-material';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import DeleteIcon from '@mui/icons-material/Delete';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import { flattenArray } from 'src/constants/columns';
import { ASSET_STATUS, CHILD_RESOURCE, MATERIAL_TYPE, REPAIR_JOB_STATUS, repairJob, SERIALIZED_PACKAGE_STATUS, sidebarResource } from 'src/constants/helpers';
import ManageSerializedAsset from 'src/pages/SerializedAsset/ManageSerializedAsset';
import AddSerializedAsset from '../../RentalManagement/SerializedAsset/AddSerializedAsset';
import ManageQtyDialog from './ManageQtyDialog';
import { FiExternalLink } from 'react-icons/fi';
import { useGetWalkmeInstance, useSetWalkmeData } from 'src/components/CustomIntro';
import { generateAddExistingSerialisedAsset, generateAddNewSerialisedAsset, generateEditSerialisedAsset } from '../walkmeSteps';
import { editDisable, repairJobMessage } from 'src/constants/messageHelpers';
import AssignSerializedPackagesDialog from 'src/components/AssignRolesDialog/AssignSerializedPackagesDialog';
import { startCase } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';

const SerializedAsset = ({
  repairJobData,
  setNextStep,
  setNextStepToolTip,
  updateJobStatus,
  renderedFrom,
  allowedToEdit,
  stepFullScreen,
  allowedOperation,
  fetchRepairJobData
}) => {
  const toastConfig = useContext(CustomToastContext);

  const { setWalkmeData } = useSetWalkmeData();
  const walkmeInstance = useGetWalkmeInstance();

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [addMaterialDialog, setAddMaterialDialog] = useState({ open: false, type: '' })
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [showEditDialog, setShowEditDialog] = useState({ open: false, isBulkedit: false, data: null, selectedRecords: [], showSaveAndNext: false });
  const [showRemoveConfirmationDialog, setShowRemoveConfirmationDialog] = useState({ open: false, data: [] })
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
          fieldNames: ['serialNumber']
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
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile || isTablet ? 'none' : 'left',
        cell: ({ row }) =>
          row.original['type'] ? (
            <p>{startCase(row.original?.type)}  </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'detail',
        Header: 'Details',
        width: 250,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            <p
              onClick={() => {
                setShowEditDialog({ open: true, isBulkedit: false, data: row?.original, selectedRecords: [], showSaveAndNext: false });
              }}
              className="link text-truncate"
              title={row.original?.detail}
            >
              {row.original?.detail}
            </p>
            <IconButton
              size="small"
              onClick={() => {
                if (row?.original?.type === MATERIAL_TYPE.serializedPackage) {
                  window.open(`${routes.serializedPackagesDetail.path}/${row?.original?._id}`);
                } else {
                  window.open(`${routes.serializedAssetDetail.path}/${row?.original?._id}`);
                }
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
    ];

    assetField?.forEach((ele) => {
      if (ele?.fieldName === 'serialNumber') {
        coloum.push({
          accessor: 'serialNumber',
          Header: ele?.fieldLabel,
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
        Cell: ({ row }) => (
          <>
            {row?.original[ele?.fieldName] ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p className="text-truncate">{row?.original[ele?.fieldName]}</p>
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
      Cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <p className="text-truncate">{row?.original?.status}</p>
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
            <HtmlTooltip title={permissions?.repairJob?.isUpdate ? 'Edit' : editDisable}>
              <IconButton
                disabled={!permissions?.repairJob?.isUpdate}
                color="primary"
                size="small"
                onClick={() => {
                  setShowEditDialog({ open: true, isBulkedit: false, data: row?.original, selectedRecords: [], showSaveAndNext: false });
                }}
                id={`edit-button-${row.index || 0}`}
              >
                <Edit color="primary" fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          }
          {((row?.original?.type === MATERIAL_TYPE.serializedPackage && row?.original?.status === SERIALIZED_PACKAGE_STATUS.reserved) || row?.original?.status === ASSET_STATUS.reserved) && allowedToEdit && permissions?.repairJob?.isUpdate && (
            <HtmlTooltip title="Delete">
              <IconButton
                size="small"
                aria-label="Delete"
                onClick={() => {
                  setShowRemoveConfirmationDialog({ open: true, data: [row?.original] });
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
      parent.detail = parent?.type === MATERIAL_TYPE.serializedPackage ? parent?.serializedPackageNumber : parent?.assetNumber || ''
      parent.productName = parent?.product?.optionLabel || '';
      parent.productDescription = parent?.productDetail?.productDescription || '';
      parent.productCategory = parent?.productCategory?.optionLabel || '';
      parent.isValid = parent['finalPrice_' + repairJobData?.currency?.toLowerCase()] ? true : !isRateRequired;
      parent.hideSelection = parent?.status === ASSET_STATUS.lost;
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
    setIsSubmitting(true);
    axiosInstance()
      .put(`${repairJob.api}/${repairJobData._id}/assets/remove`, showRemoveConfirmationDialog?.data?.map(d => ({ _id: d?._id, type: d?.type })))
      .then(({ data }) => {
        setIsSubmitting(false);
        setShowRemoveConfirmationDialog({ open: false, data: [] });
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
    setIsSubmitting(true);
    axiosInstance()
      .post(`${repairJob.api}/${repairJobData._id}/assets`, { assets: rows })
      .then(({ data }) => {
        setAddMaterialDialog({ open: false, type: '' })
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
        setIsSubmitting(false);
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setIsSubmitting(true);
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
          setShowEditDialog({
            open: true,
            isBulkedit: false,
            data: dataRows[rowIndex + 1],
            selectedRecords: [],
            showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
          });
        } else {
          setShowEditDialog({ open: false, isBulkedit: false, data: null, selectedRecords: [], showSaveAndNext: false });
        }
        setIsSubmitting(false);
      })
      .catch((error) => {
        setIsSubmitting(false);
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
            setAddMaterialDialog({ open: true, type: MATERIAL_TYPE.serializedAsset })
          }}
          id={'add-existing-serialised-asset-menu-item'}
        >
          Add Existing {resources?.serializedAsset?.titlePlural}
        </MenuItem>
        {permissions?.serializedAsset?.isCreate && (
          <MenuItem
            onClick={() => {
              setAddMaterialDialog({ open: true, type: `new_${MATERIAL_TYPE.serializedAsset}` })
            }}
            id={'add-new-serialised-asset-menu-item'}
          >
            Add New {resources?.serializedAsset?.titleSingular}
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setAddMaterialDialog({ open: true, type: MATERIAL_TYPE.serializedPackage })
          }}
          id={'add-existing-serialised-package-menu-item'}
        >
          Add Existing {resources?.serializedPackages?.titlePlural}
        </MenuItem>
      </>
    );
  };

  const actionButtonMenuitems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.length === 0}
          onClick={() => {
            setShowEditDialog({ open: true, isBulkedit: true, data: null, selectedRecords: selectedRecords, showSaveAndNext: false });
          }}
        >
          {'Bulk Edit'}
        </MenuItem>
        <MenuItem
          disabled={selectedRecords.length === 0 || selectedRecords.some((s) => {
            if (s?.type === MATERIAL_TYPE.serializedPackage) {
              return s?.status !== SERIALIZED_PACKAGE_STATUS.reserved
            } else {
              return s?.status !== ASSET_STATUS.reserved
            }
          })}
          onClick={() => {
            setShowRemoveConfirmationDialog({ open: true, data: selectedRecords });
          }}
        >
          {'Delete'}
        </MenuItem>
      </>
    );
  };

  return (
    <>
      {allowedToEdit && repairJobData?.status !== REPAIR_JOB_STATUS.completed && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={allowedOperation}
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
      {addMaterialDialog.open && addMaterialDialog.type === MATERIAL_TYPE.serializedAsset && (
        <AddSerializedAsset
          referenceType="Repair Job"
          addSerializedAsset={(rows) => {
            handleAdd(rows?.map(r => ({ _id: r?._id || r?.id, currentStatus: r?.status, type: MATERIAL_TYPE.serializedAsset })));
          }}
          handleSerializedAssetClose={() => {
            setAddMaterialDialog({ open: false, type: '' })
          }}
          isAdding={isSubmitting}
          selectedProducts={[]}
          filterByPlant={repairJobData.warehouse}
          chartOfAccount={repairJobData?.chartOfAccount}
          ids={dataRows?.map((d) => d?._id)}
        />
      )}
      {addMaterialDialog.open && addMaterialDialog.type === `new_${MATERIAL_TYPE.serializedAsset}` && (
        <ManageSerializedAsset
          onClose={() => setAddMaterialDialog({ open: false, type: '' })}
          referenceType={'repairJob'}
          referenceData={{
            warehouse: repairJobData?.warehouse?.optionValue
          }}
          onSuccess={(data) => {
            handleAdd([{ _id: data?._id, currentStatus: data?.status, type: MATERIAL_TYPE.serializedAsset }]);
          }}
        />
      )}
      {addMaterialDialog.open && addMaterialDialog.type === MATERIAL_TYPE.serializedPackage && (
        <AssignSerializedPackagesDialog
          onSuccess={(data) => {
            handleAdd(data?.map(d => ({ _id: d?._id, type: MATERIAL_TYPE.serializedPackage })))
          }}
          handleClose={() => {
            setAddMaterialDialog({ open: false, type: '' })
          }}
          extraDeepFilter={[{ field: 'status', term: SERIALIZED_PACKAGE_STATUS.available }]}
          isSubmitting={isSubmitting}
        />
      )}

      {showRemoveConfirmationDialog.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete ${showRemoveConfirmationDialog?.data?.length === 1 ? showRemoveConfirmationDialog?.data[0]['detail'] : 'selected records'} ?`}
          onClose={() => {
            setShowRemoveConfirmationDialog({ open: false, data: [] });
          }}
          onOk={deleteRepairJobAssets}
          okBtnLoading={isSubmitting}
        />
      )}

      {showEditDialog.open && (
        <ManageQtyDialog
          repairJobData={repairJobData}
          allFields={allFields}
          onClose={() => {
            setShowEditDialog({ open: false, isBulkedit: false, data: null, selectedRecords: [], showSaveAndNext: false });
          }}
          handleSaveData={handleSaveData}
          loadingEdit={isSubmitting}
          isBulkedit={showEditDialog.isBulkedit}
          data={showEditDialog.data}
          selectedRecords={showEditDialog.selectedRecords}
          showSaveAndNext={showEditDialog.showSaveAndNext}
        />
      )}

    </>
  );
};
export default SerializedAsset;
