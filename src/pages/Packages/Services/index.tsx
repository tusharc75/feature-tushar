import { Box, Button, MenuItem } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { GrDrag } from 'react-icons/gr';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { packages, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';

const ServiceTable = ({ packageId, packageData, allowedToEdit, fullHeight = false }) => {
  const renderedFrom = `${camelCase(sidebarResource?.packages)}_service'}`;

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showServiceConfirmBox, setShowServiceConfirmBox] = useState(false);
  const [showServiceAssignDialog, setShowServiceAssignDialog] = useState(false);
  const [isRemovingServices, setRemovingServices] = useState(false);
  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [arrangeView, setArrangeView] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const { dataRows, selectedRecords } = state;

  useEffect(() => {
    fetchGridColumns();
    fetchData();
  }, []);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    axiosInstance()
      .get(`${packages.api}/${packageId}/services`)
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let res = {
            ...prepareDataForGrid(u, user)
          };
          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: data.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(err);
      });
  };

  const defaultColumns = [
    {
      accessor: 'order',
      Header: 'Sequence',
      show: true,
      filter: false,
      sortable: false,
      Cell: ({ row }) => (row.original?.order ? <div>{row?.original?.order}</div> : <NoDataCell />)
    },
    {
      accessor: 'qty',
      Header: 'Qty',
      editable: allowedToEdit,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => (row.original?.qty ? <div>{row.original?.qty}</div> : <NoDataCell />)
    }
  ];

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.serviceMaster}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes.serviceMasterDetail.path);
    setColumns([...defaultColumns, ...newColumns]);
  };

  const onSaveInlineEdit = (data, row) => {
    axiosInstance()
      .put(`${packages.api}/${packageId}/services`, {
        ids: [row?._id],
        qty: Number(data?.qty)
      })
      .then(() => {
        fetchData();
      })
      .catch((err) => toastConfig.setToastConfig(err));
  };

  const removeProducts = () => {
    setRemovingServices(true);
    const Ids = selectedRecords.map((d) => d._id);
    axiosInstance()
      .put(`${packages.api}/${packageId}/services/remove`, { ids: Ids })
      .then(() => {
        setRemovingServices(false);
        setShowServiceConfirmBox(false);
        fetchData();
      })
      .catch((err) => {
        setRemovingServices(false);
        setShowServiceConfirmBox(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleArrangeUpdate = (rows: any) => {
    setIsAssigning(true);
    rows?.forEach((e: any) => {
      delete e.preWork;
      delete e.name;
    });
    axiosInstance()
      .put(`${packages.api}/${packageId}/services/order`, {
        packageType: packageData?.packageType,
        data: rows || []
      })
      .then(() => {
        fetchData();
        setIsAssigning(false);
        setArrangeView(false);
      })
      .catch((err) => {
        setIsAssigning(false);
        setArrangeView(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleAdd = async (rows) => {
    setIsAssigning(true);
    axiosInstance()
      .post(`${packages.api}/material`, {
        ids: [packageId],
        services: rows.map((d: any) => ({ service: d.id, qty: Number(d.qty) }))
      })
      .then(({ data }) => {
        setShowServiceAssignDialog(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        setIsAssigning(false);
      })
      .catch((err) => {
        setShowServiceAssignDialog(false);
        setIsAssigning(false);
        toastConfig.setToastConfig(err);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem onClick={() => setShowServiceAssignDialog(true)}>Add Existing Services</MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.length === 0 || isRemovingServices}
          onClick={() => {
            setShowServiceConfirmBox(true);
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
            module="services"
            api={`${packages.api}/${packageId}/services`}
            afterImportCompleted={() => {
              fetchData();
            }}
            isExportAllOrSomeFeature={true}
            ids={[]}
            additionalParams={`refrenceId=${packageId}`}
          />
          <Button variant="outlined" color="primary" size="small" onClick={() => setArrangeView(true)}>
            <GrDrag fontSize="small" color="primary" className="mr-1" />
            Arrange
          </Button>
        </>
      )
    );
  };

  return (
    <Box>
      <DetailsPageHeader
        isAddButtonVisible={allowedToEdit}
        addButtonMenuItems={addButtonMenuItems()}
        isActionButtonVisible={allowedToEdit}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: selectedRecords.length === 0 || isRemovingServices }}
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
          hideSelection={!allowedToEdit}
          hideExportTable={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showServiceAssignDialog && (
        <AssignServiceDialog
          handleClose={() => setShowServiceAssignDialog(false)}
          ids={[...dataRows?.map((e) => e._id)]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isAssigning}
        />
      )}
      {showServiceConfirmBox && (
        <ConfirmationDialog
          open={showServiceConfirmBox}
          message={`Are you sure you want to delete the service(s) ?`}
          onClose={() => {
            setShowServiceConfirmBox(false);
          }}
          okBtnLoading={isRemovingServices}
          onOk={removeProducts}
        />
      )}
      {arrangeView && (
        <ArrangeView
          data={
            dataRows?.map((d) => {
              return { _id: d?._id, name: d?.serviceName || d?.productName, order: d?.order, preWork: d?.preWork };
            }) || []
          }
          title={'Arrange'}
          handleClose={() => setArrangeView(false)}
          handleSubmit={handleArrangeUpdate}
          loading={isAssigning}
        />
      )}
    </Box>
  );
};

export default ServiceTable;
