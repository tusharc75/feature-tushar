import { useContext, useEffect, useState } from 'react';
import { Box, Button, Menu, MenuItem } from '@material-ui/core';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { prepareDataForGrid, packages, sidebarResource } from 'src/constants/helpers';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { isMobile } from 'react-device-detect';

const PackagesTable = ({ packageId, packageData, allowedToEdit, fullHeight = false }) => {
  const renderedFrom = `${camelCase(sidebarResource?.packages)}_packages'}`;

  const { setToastConfig } = useContext(CustomToastContext);
  const {
    state: { permissions, user }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showProductConfirmBox, setShowProductConfirmBox] = useState(false);
  const [showProductAssignDialog, setShowProductAssignDialog] = useState(false);
  const [showServiceAssignDialog, setShowServiceAssignDialog] = useState(false);
  const [isRemovingProducts, setRemovingProducts] = useState(false);
  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGridColumns();
    fetchData();
  }, []);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    axiosInstance()
      .get(`${packages.api}/${packageId}/package`)
      .then(({ data: { data } }) => {
        let rows = data.map((u, index) => {
          let res: any = {
            ...prepareDataForGrid(u, user)
          };
          res.index = index + 1;
          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: data.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
        setToastConfig(err);
      });
  };

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Packages`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes.packagesDetail.path);
    setColumns([
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        editable: allowedToEdit,
        disableFilters: true,
        disableSortBy: true,
        disabled: true,
        Cell: ({ row }) => (row.original?.qty ? <div>{row.original?.qty}</div> : <NoDataCell />)
      },
      ...newColumns
    ]);
  };

  const onSaveInlineEdit = (data, row) => {
    if (Number(row?.qty) > 0) {
      axiosInstance()
        .put(`${packages.api}/${packageId}/package`, {
          ids: [row?._id],
          qty: Number(data?.qty)
        })
        .then(() => {
          fetchData();
        })
        .catch((err) => setToastConfig(err));
    } else {
      fetchData();
    }
  };

  const removeProducts = () => {
    setRemovingProducts(true);
    const Ids = selectedRecords.map((d) => d._id);
    axiosInstance()
      .put(`${packages.api}/${packageId}/package/remove`, { ids: Ids })
      .then(() => {
        setRemovingProducts(false);
        setShowProductConfirmBox(false);
        fetchData();
      })
      .catch((err) => {
        setRemovingProducts(false);
        setShowProductConfirmBox(false);
        setToastConfig(err);
      });
  };

  const handleAssignPackage = (rows) => {
    setSubmitting(true);
    axiosInstance()
      .post(`${packages.api}/${packageId}/package`, {
        ids: [packageId],
        packages: rows?.map((d: any) => ({ packageId: d?._id, qty: d?.qty ? Number(d?.qty) : Number(1) }))
      })
      .then(() => {
        setShowProductAssignDialog(false);
        setShowServiceAssignDialog(false);
        fetchData();
        setSubmitting(false);
      })
      .catch((err) => {
        setSubmitting(false);
        setToastConfig(err);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem onClick={() => setShowProductAssignDialog(true)}>Add Existing Product Packages</MenuItem>
        <Box ml={1} />
        <MenuItem onClick={() => setShowServiceAssignDialog(true)}>Add Existing Service Packages</MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.length === 0 || isRemovingProducts}
          onClick={() => {
            setShowProductConfirmBox(true);
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  const rightSideContents = () => {
    return (
      allowedToEdit && (
        <>
          <ImportExportMenu
            permissions={permissions?.packages}
            module="packages"
            api={`${packages.api}/${packageId}/package`}
            afterImportCompleted={() => {
              fetchData();
            }}
            isExportAllOrSomeFeature={true}
            ids={[]}
            additionalParams={`refrenceId=${packageId}`}
          />
        </>
      )
    );
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={allowedToEdit}
        addButtonMenuItems={addButtonMenuItems()}
        isActionButtonVisible={allowedToEdit}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: selectedRecords.length === 0 || isRemovingProducts }}
        rightSideContents={rightSideContents()}
        hasXpadding
      />
      {columns ? (
        <CustomReactTable
          height={fullHeight ? 'calc(100vh - 250px)' : 'calc(100vh - 393px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
          refreshGrid={fetchData}
          onSaveEdit={onSaveInlineEdit}
          hideSelection={allowedToEdit ? false : true}
          hideExportTable={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showProductAssignDialog && (
        <AssignPackageDialog
          handleClose={() => setShowProductAssignDialog(false)}
          ids={[...dataRows?.map((e) => e._id), packageId]}
          onSuccess={(rows) => {
            handleAssignPackage(rows);
          }}
          packageType={'Product'}
          isSubmitting={isSubmitting}
        />
      )}
      {showServiceAssignDialog && (
        <AssignPackageDialog
          handleClose={() => setShowServiceAssignDialog(false)}
          ids={[...dataRows?.map((e) => e._id), packageId]}
          onSuccess={(rows) => {
            handleAssignPackage(rows);
          }}
          packageType={'Service'}
          isSubmitting={isSubmitting}
        />
      )}
      {showProductConfirmBox && (
        <ConfirmationDialog
          open={showProductConfirmBox}
          message={`Are you sure you want to delete the product(s) ?`}
          onClose={() => {
            setShowProductConfirmBox(false);
          }}
          okBtnLoading={isRemovingProducts}
          onOk={removeProducts}
        />
      )}
    </>
  );
};

export default PackagesTable;
