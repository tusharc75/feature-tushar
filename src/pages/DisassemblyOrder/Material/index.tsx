import { Box, IconButton, MenuItem } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import AssignManagedPackagesDialog from 'src/components/AssignRolesDialog/AssignManagedPackagesDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { MANAGED_PACKAGES_STATUS, MATERIAL_TYPE, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';

const Material = ({ disassemblyOrderData, setNextStep, renderedFrom, stepFullScreen, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [deleteData, setDeleteData] = useState(null);

  useEffect(() => {
    fetchFields();
    fetchData();
  }, [disassemblyOrderData]);

  const fetchFields = async () => {
    const {
      data: { data }
    } = await axiosInstance().get(`/field?resource=${sidebarResource.managedPackages}`);
    const newColumns = generateColumns(
      renderedFrom,
      data?.filter((d) => d?.fieldData?.fieldName === 'managedPackageName'),
      routes.managedPackagesDetail.path,
      true
    );

    newColumns?.forEach((c) => {
      if (c?.accessor === 'managedPackageName') {
        c.cell = ({ row }) =>
          row.original?.managedPackageName && row.original.managedPackageId ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row.original?.managedPackageName}</h5>
              <Box>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.managedPackagesDetail.path}/${row.original.managedPackageId}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </Box>
            </div>
          ) : (
            <NoDataCell />
          );
      }
    });

    const coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <h5 className="text-truncate">{row.original.index}</h5>
        // Footer: () => {
        //   return <>Total</>;
        // }
      },
      ...newColumns,
      {
        accessor: 'package',
        Header: resources?.packages?.titleSingular,
        width: 200,
        show: false,
        Cell: ({ row }) =>
          row.original?.package && row.original.packageId ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row.original?.package}</h5>
              <Box>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.packagesDetail.path}/${row.original.packageId}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </Box>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'action',
        Header: 'Actions',
        minWidth: 100,
        width: 100,
        sticky: 'right',
        Cell: ({ row, table }) => (
          <>
            <HtmlTooltip title={row.original?.canDelete ? 'Delete' : 'Work Order is already assigned'}>
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  setDeleteData([row.original._id]);
                }}
                disabled={row.original?.canDelete ? false : true}
              >
                <DeleteIcon fontSize="small" color={row.original?.canDelete ? 'error' : 'disabled'} />
              </IconButton>
            </HtmlTooltip>
          </>
        )
      }
    ];
    setColumns(coloum);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    setNextStep(false);
    const {
      data: {
        data: { material }
      }
    } = await axiosInstance().get(`${routes.disassemblyOrder.path}/material/${disassemblyOrderData._id}`);

    const rows = material?.map((m, i) => ({
      index: i + 1,
      _id: m?._id,
      managedPackageName: m?.managedPackageDetail?.managedPackageName,
      managedPackageId: m?.managedPackageDetail?._id,
      package: m?.managedPackageDetail?.package?.packageName,
      packageId: m?.managedPackageDetail?.package?._id,
      canDelete: true
    }));
    setNextStep(true);

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const handleAdd = async (rows) => {
    setSubmitting(true);
    const material = rows?.map((r) => ({ materialId: r?._id, type: MATERIAL_TYPE?.serializedPackage }));

    axiosInstance()
      .post(`${routes.disassemblyOrder.path}/material/${disassemblyOrderData._id}`, { material })
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        setOpen(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        setSubmitting(false);
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setSubmitting(true);
    axiosInstance()
      .put(`${routes.disassemblyOrder.path}/material/${disassemblyOrderData?._id}/delete`, { ids: rows })
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        setSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        setDeleteData(null);
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setOpen(true);
          }}
        >
          Add Existing {resources?.managedPackages?.titlePlural}
        </MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords?.every((e) => e.canDelete) ? false : true}
          onClick={() => {
            const dataToDelete = selectedRecords?.filter((e) => e.canDelete).map((rec: any) => rec._id);
            setDeleteData(dataToDelete);
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <>
      {allowedToEdit && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonMenuItems={addButtonMenuItems()}
            isActionButtonVisible={true}
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: selectedRecords?.filter((e) => !e.hideSelection)?.length > 0 ? false : true }}
            hasXpadding
          />
        </>
      )}
      {columns ? (
        <>
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
              isClientSideGrid={true}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {open && (
        <AssignManagedPackagesDialog
          onSuccess={handleAdd}
          handleClose={() => {
            setOpen(false);
          }}
          extraFilterById={[{ field: 'warehouse', term: { $in: [disassemblyOrderData?.warehouse?.optionValue] } }]}
          extraDeepFilter={[
            { field: 'status', term: [MANAGED_PACKAGES_STATUS.new, MANAGED_PACKAGES_STATUS.available, MANAGED_PACKAGES_STATUS.underReview] }
          ]}
          isSubmitting={isSubmitting}
          ids={dataRows?.map((d) => d?.managedPackageId)}
        />
      )}
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete the record(s)?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isSubmitting}
        />
      )}
    </>
  );
};

export default Material;
