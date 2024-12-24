import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@material-ui/icons/Delete';
import { Fragment, useContext, useEffect, useState } from 'react';
import { FcApproval } from 'react-icons/fc';
import { HiBadgeCheck } from 'react-icons/hi';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { gridLoadingTimeout, packages, prepareDataForGrid, product } from 'src/constants/helpers';
import { deleteDisable } from 'src/constants/messageHelpers';

const ServicePackage = ({ renderedFrom, productId }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const [columns, setColumns] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const {
    state: { permissions, resources }
  }: any = useData();
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchGridColumns = () => {
    setColumns(null);
    axiosInstance()
      .get(`/field?resource=${packages.resource}`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(renderedFrom, data, routes.packagesDetail.path);
        setColumns([...newColumns, ActionsRenderer]);
      });
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    axiosInstance()
      .get(`${product.api}/${productId}/package`)
      .then(({ data: { data } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          let res = {
            ...finalObject
          };
          return res;
        });
        dispatch({
          type: 'initialize',
          data: rows,
          count: data.length
        });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
        fetchGridColumns();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 150,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <div>
        {permissions?.product?.isUpdate && (
          <HtmlTooltip title={row?.original?.default ? 'Remove Default' : 'Set Default'}>
            <span>
              <IconButton
                aria-label={'Default'}
                size="small"
                onClick={() => {
                  handleUpdate({
                    ids: [row?.original?._id],
                    default: !row?.original?.default
                  });
                }}
              >
                {row?.original?.default ? <FcApproval fontSize={'23px'} /> : <HiBadgeCheck fontSize={'23px'} />}
              </IconButton>
            </span>
          </HtmlTooltip>
        )}
        <HtmlTooltip title={permissions?.product?.isUpdate ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              disabled={permissions?.product?.isUpdate ? false : true}
              size="small"
              aria-label="Delete"
              onClick={() => {
                setDeleteRecord(row?.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon color={permissions?.product?.isUpdate ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </div>
    )
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
      setDeleteRecord(null);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    setDeleting(true);
    axiosInstance()
      .put(`${product.api}/${productId}/package/remove`, { ids: ids })
      .then(() => {
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setDeleting(false);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdate = (data: any) => {
    axiosInstance()
      .put(`${product.api}/${productId}/package`, data)
      .then(() => {
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleSubmit = (rows) => {
    setSubmitting(true);
    axiosInstance()
      .post(`${product.api}/${productId}/package`, {
        package: rows?.map((e) => e?._id)
      })
      .then(() => {
        fetchData();
        setSubmitting(false);
        setOpenAddDialog(false);
      })
      .catch((err) => {
        setSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem onClick={() => setOpenAddDialog(true)}>Add Service Packages</MenuItem>
      </>
    );
  };
  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem disabled={selectedRecords.length === 0} onClick={() => setShowDeleteConfirmBox(true)}>
          Delete
        </MenuItem>
      </>
    );
  };

  const rightSideContents = () => {
    return (
      <>
        <ImportExportMenu
          permissions={permissions?.packages}
          module="packages"
          api={`${product.api}/unknown/package`}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          ids={[]}
          additionalParams={`productId=${productId}`}
        />
      </>
    );
  };

  return (
    <Fragment>
      {permissions?.product?.isUpdate && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonMenuItems={addButtonMenuItems()}
            isActionButtonVisible={true}
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
            rightSideContents={rightSideContents()}
            hasXpadding={false}
          />
        </>
      )}
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 150px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          isClientSideGrid={true}
          hideSelection={!permissions?.product.isUpdate}
          hideAction={!permissions?.product.isUpdate}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${resources?.packages?.titleSingular} ? `}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
          okBtnLoading={isDeleting}
        />
      )}
      {openAddDialog && (
        <AssignPackageDialog
          handleClose={() => setOpenAddDialog(false)}
          ids={[...dataRows?.map((e) => e._id)]}
          onSuccess={(rows) => {
            handleSubmit(rows);
          }}
          packageType={'Service'}
          isSubmitting={isSubmitting}
        />
      )}
    </Fragment>
  );
};

export default ServicePackage;
