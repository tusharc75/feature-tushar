import { useContext, useEffect, useState } from 'react';
import { camelCase, startCase } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { Box, Button, IconButton, MenuItem, Typography } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { MATERIAL_TYPE, gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import ManageStep from '../ManageStep';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import DetailsPage from '../../../../components/Shared/DetailsPage';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { deleteDisable, editDisable } from 'src/constants/messageHelpers';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import ResourceField from './ResourceField';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import { isMobile, isTablet } from 'react-device-detect';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { flattenArray } from 'src/constants/columns';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import { FiExternalLink } from 'react-icons/fi';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const View = ({
  step,
  allowedToEdit,
  data,
  resource,
  resourceId,
  setNextStep = null,
  fromAccordian = false,
  stepFullScreen = false,
  referenceData
}) => {
  const toastConfig = useContext(CustomToastContext);

  const renderedFrom = `${camelCase(resource)}_${camelCase(step?.stepName)}`;

  const [open, setOpen] = useState({ open: false, id: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [openMaterial, setOpenMaterial] = useState({ open: false, type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchColumns();
  }, [step]);

  useEffect(() => {
    if (step && (step?.fields?.length || step?.linkWithMaterial)) {
      fetchData();
    }
  }, [step]);

  const fetchColumns = async () => {
    setColumns(null);
    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      ...(step?.linkWithMaterial
        ? [
          {
            accessor: 'type',
            Header: 'Type',
            disableFilters: true,
            disabled: true,
            sticky: isMobile || isTablet ? 'none' : 'left',
            width: 200,
            Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
          },
          {
            accessor: 'detail',
            Header: 'Details',
            minWidth: 300,
            width: 300,
            disabled: true,
            sticky: isMobile || isTablet ? 'none' : 'left',
            Cell: ({ row }) => (
              <div className="flex items-center gap-2">
                <p className="text-truncate" title={row.original.detail}>
                  {row.original.detail}
                </p>
                <IconButton
                  size="small"
                  onClick={() => {
                    if (row.original.type === MATERIAL_TYPE.product) {
                      window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                    }
                    if (row.original.type === MATERIAL_TYPE.service) {
                      window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                    }
                    if (row.original.type === MATERIAL_TYPE.package) {
                      window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                    }
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </div>
            )
          },
          {
            accessor: 'description',
            Header: 'Description',
            Cell: ({ row }) => (row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />)
          }
        ]
        : [])
    ];
    const newColumns = await generateColumns(renderedFrom, step?.fields || [], null, false, data?.currency);
    const ActionsRenderer = {
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 110,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) => (
        <>
          {step?.fields?.length > 0 && (
            <HtmlTooltip title={allowedToEdit ? 'Edit' : editDisable}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Edit"
                  disabled={allowedToEdit ? false : true}
                  onClick={() => {
                    setOpen({ open: true, id: row?.original?._id });
                  }}
                >
                  <EditIcon fontSize="small" color={allowedToEdit ? 'primary' : 'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          )}
          <HtmlTooltip title={allowedToEdit ? 'Delete' : deleteDisable}>
            <span>
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={allowedToEdit ? false : true}
                onClick={() => {
                  setDeleteRecord(row?.original);
                  setShowDeleteConfirmBox(true);
                }}
              >
                <DeleteIcon fontSize="small" color={allowedToEdit ? 'error' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        </>
      )
    };
    setColumns([...column, ...newColumns, ActionsRenderer]);
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`/dynamic-form/step/${resourceId}/${step?._id}`, {
        headers: {
          Resource: resource
        }
      })
      .then(({ data: { data } }) => {
        const rows = data?.filter((e) => e?.parentId === null || !e?.parentId);
        let _rows = rows?.map((u, i) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['index'] = i + 1;
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['detail'] =
            u?.type === MATERIAL_TYPE.product
              ? u?.productDetail?.productName
              : u?.type === MATERIAL_TYPE.service
                ? u?.serviceDetail?.serviceName
                : u?.type === MATERIAL_TYPE.package
                  ? u?.packageDetail?.packageName
                  : '';
          finalObject['description'] =
            u?.type === MATERIAL_TYPE.product
              ? u?.productDetail?.productDescription
              : u?.type === MATERIAL_TYPE.service
                ? u?.serviceDetail?.serviceDescription
                : u?.type === MATERIAL_TYPE.package
                  ? u?.packageDetail?.packageDescription
                  : '';
          finalObject['subRows'] = generateNestedData(data, finalObject);
          return finalObject;
        });

        dispatch({ type: 'initialize', data: _rows, count: data?.length });
        if (setNextStep) {
          if (data?.length > 0) {
            setNextStep(true);
          } else {
            setNextStep(false);
          }
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow['isChecked'] = selectedRecords?.some((s) => s._id === _subRow._id);
      _subRow.detail =
        _subRow?.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productName
          : _subRow?.type === MATERIAL_TYPE.service
            ? _subRow?.serviceDetail?.serviceName
            : _subRow?.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageName
              : '';
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
    });

    return subRows;
  };

  const handleAdd = (rows) => {
    const values = rows?.map((r) => ({ type: openMaterial?.type, materialId: r?._id, parentId: null, qty: r?.qty, stepId: step?._id }));
    setIsSubmitting(true);
    axiosInstance()
      .post(`/dynamic-form/step/${resourceId}`, values, {
        headers: {
          Resource: resource
        }
      })
      .then(({ data }) => {
        setIsSubmitting(false);
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = async () => {
    let ids: any = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(
        `/dynamic-form/step/remove/${resourceId}`,
        { ids: ids, stepId: step?._id },
        {
          headers: {
            Resource: resource
          }
        }
      )
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(dataRows), inputField, step?.fields || [], updatedData, data?.currency);
    axiosInstance()
      .put(
        `/dynamic-form/step/${resourceId}`,
        { ...rows[0], stepId: step?._id },
        {
          headers: {
            Resource: resource
          }
        }
      )
      .then(({ data }) => {
        fetchData();
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

  const actionButtonMenuItems = () => {
    return (
      <MenuItem disabled={selectedRecords.length ? false : true} onClick={() => setShowDeleteConfirmBox(true)}>
        Delete
      </MenuItem>
    );
  };

  const addButtonMenuItems = () => {
    return step?.linkWithMaterial
      ? step?.linkedMaterial?.map((m) => (
        <MenuItem onClick={() => setOpenMaterial({ open: true, type: m })}>Add Existing {startCase(m) + 's'}</MenuItem>
      ))
      : null;
  };

  return (
    <>
      {step?.linkWithResource ? (
        <ResourceField step={step} renderedFrom={renderedFrom} data={data} stepFullScreen={stepFullScreen} referenceData={referenceData} />
      ) : (
        <>
          {step?.fields?.length || step?.linkWithMaterial ? (
            step?.multipleStepData ? (
              <>
                {allowedToEdit && (
                  <DetailsPageHeader
                    isAddButtonVisible={step?.linkWithMaterial ? true : false}
                    addButtonMenuItems={addButtonMenuItems()}
                    isActionButtonVisible={true}
                    actionButtonMenuItems={actionButtonMenuItems()}
                    actionButtonProps={{ disabled: !Boolean(selectedRecords?.length) }}
                    hasXpadding
                    leftSideContents={
                      !step?.linkWithMaterial ? (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => {
                            setOpen({ open: true, id: null });
                          }}
                        >
                          Add
                        </Button>
                      ) : null
                    }
                  />
                )}
                <Box zIndex={5} width={'100%'}>
                  {columns ? (
                    <CustomReactTable
                      height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                      columns={columns}
                      state={state}
                      dispatch={dispatch}
                      renderedFrom={renderedFrom}
                      isClientSideGrid={true}
                      onSaveEdit={onSaveInlineEdit}
                      refreshGrid={fetchData}
                      expander={true}
                    />
                  ) : (
                    <Box p={2} height={500}>
                      <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                  )}
                </Box>
              </>
            ) : (
              <>
                <Box textAlign={'right'}>
                  <Button
                    className={'no-shadow'}
                    onClick={() => {
                      setOpen({ open: true, id: dataRows[0] ? dataRows[0]?._id : null });
                    }}
                    variant={'contained'}
                    size="small"
                    color="primary"
                  >
                    Edit
                  </Button>
                </Box>
                <Box mt={2}>
                  <DetailsPage data={dataRows[0] || {}} fields={step?.fields?.map((f) => ({ fieldData: f }))} />
                </Box>
              </>
            )
          ) : (
            <Box minHeight={fromAccordian ? '50px' : '270px'} display={'flex'} alignItems={'center'} justifyContent={'center'}>
              <Typography>No Fields</Typography>
            </Box>
          )}
          {open?.open && (
            <ManageStep
              onClose={() => {
                setOpen({ open: false, id: null });
              }}
              onSuccess={() => {
                fetchData();
                setOpen({ open: false, id: null });
              }}
              resource={resource}
              resourceId={resourceId}
              stepId={step?._id}
              id={open?.id}
              fields={step?.fields || []}
            />
          )}
          {showDeleteConfirmBox && (
            <ConfirmationDialog
              open={showDeleteConfirmBox}
              message={`Are you sure, you want to delete selected item(s)?`}
              onClose={() => {
                setDeleteRecord(null);
                setShowDeleteConfirmBox(false);
              }}
              onOk={handleDelete}
            />
          )}
          {openMaterial?.open && openMaterial?.type === MATERIAL_TYPE.product && (
            <AssignProductDialog
              handleCloseDialog={() => setOpenMaterial({ open: false, type: '' })}
              onSuccess={(rows) => {
                setOpenMaterial({ open: false, type: '' });
                handleAdd(rows);
              }}
              isSubmitting={isSubmitting}
              ids={dataRows?.filter((d) => d?.type === MATERIAL_TYPE.product)?.map((e) => e?.materialId)}
            />
          )}
          {openMaterial.open && openMaterial.type === MATERIAL_TYPE.service && (
            <AssignServiceDialog
              handleClose={() => setOpenMaterial({ open: false, type: '' })}
              onSuccess={(rows) => {
                setOpenMaterial({ open: false, type: '' });
                handleAdd(rows);
              }}
              isSubmitting={isSubmitting}
              ids={dataRows?.filter((d) => d?.type === MATERIAL_TYPE.service)?.map((e) => e?.materialId)}
            />
          )}
          {openMaterial.open && openMaterial.type === MATERIAL_TYPE.package && (
            <AssignPackageDialog
              handleClose={() => setOpenMaterial({ open: false, type: '' })}
              onSuccess={(rows) => {
                setOpenMaterial({ open: false, type: '' });
                handleAdd(rows);
              }}
              isSubmitting={isSubmitting}
              ids={dataRows?.filter((d) => d?.type === MATERIAL_TYPE.package)?.map((e) => e?.materialId)}
            />
          )}
        </>
      )}
    </>
  );
};

export default View;
