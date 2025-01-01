import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import { Box, IconButton, MenuItem, useMediaQuery } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { gridLoadingTimeout, serviceMaster, sidebarResource } from 'src/constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import FieldDialog from './FieldDialog';
import StepDialog from './StepDialog';
import { LowPriority } from '@mui/icons-material';

const renderedFrom = `${camelCase(sidebarResource?.serviceMaster)}_steps`;

const Steps = ({ serviceId }) => {
  const isMobile = useMediaQuery('(max-width:768px)');
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, dataRows, page, limit, selectedRecords } = state;
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();

  const [stepDialog, setStepDialog] = useState({ open: false, stepId: '' });
  const [stepFieldsDialog, setStepFieldsDialog] = useState({ open: false, stepIds: [] });
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, ids: null });
  const [arrangeView, setArrangeView] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const columns = [
    {
      accessor: 'stepName',
      Header: 'Step Name',
      primaryField: true,
      disabled: true,
      width: 300,
      Cell: ({ row }) => (
        <>
          {row?.original?.stepName ? (
            <h5
              title={row?.original?.stepName}
              onClick={() => {
                setStepDialog({ open: true, stepId: row?.original?._id });
              }}
              className="link text-truncate"
            >
              {row?.original?.stepName}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'order',
      Header: 'Sequence',
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.order ? (
            <h5 className="text-truncate" title={row?.original?.order}>
              {row?.original?.order}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'leadDay',
      Header: 'Lead Time',
      Cell: ({ row }) => (
        <>
          {row?.original?.leadDay ? (
            <h5 className="text-truncate" title={row?.original?.leadDay}>
              {row?.original?.leadDay}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'costPrice',
      Header: 'Cost Price',
      Cell: ({ row }) => (
        <>
          {row?.original?.costPrice ? (
            <h5 className="text-truncate" title={row?.original?.costPrice}>
              {row?.original?.costPrice}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'listPrice',
      Header: 'List Price',
      Cell: ({ row }) => (
        <>
          {row?.original?.listPrice ? (
            <h5 className="text-truncate" title={row?.original?.listPrice}>
              {row?.original?.listPrice}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'fieldCount',
      Header: 'Fields',
      Cell: ({ row }) => (
        <>
          {row?.original?.fieldCount ? (
            <h5 className="text-truncate" title={row?.original?.fieldCount}>
              {row?.original?.fieldCount}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
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
          <HtmlTooltip title={'Edit'}>
            <IconButton
              size="small"
              aria-label="Edit"
              onClick={() => {
                setStepDialog({ open: true, stepId: row.original?._id });
              }}
            >
              <EditIcon fontSize="small" color={'primary'} />
            </IconButton>
          </HtmlTooltip>

          {isMobile ? null : (
            <HtmlTooltip title="Add Fields">
              <IconButton
                aria-label="setting"
                onClick={(e) => {
                  setStepFieldsDialog({ open: true, stepIds: [row?.original?._id] });
                }}
                size="small"
              >
                <Build color="primary" fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          )}
          <HtmlTooltip title={'Delete'}>
            <IconButton
              size="small"
              aria-label="Delete"
              onClick={() => {
                setShowConfirmBox({ open: true, ids: [row.original?._id] });
              }}
            >
              <DeleteIcon fontSize="small" color={'error'} />
            </IconButton>
          </HtmlTooltip>
        </>
      )
    }
  ];

  useEffect(() => {
    fetchStepsData();
  }, [serviceId]);

  const fetchStepsData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    axiosInstance()
      .get(`${serviceMaster.api}/steps/${serviceId}`)
      .then(({ data: { data } }) => {
        data?.forEach((e: any) => {
          e.fieldCount = e?.fields?.length;
        });
        dispatch({
          type: 'initialize',
          data: data,
          count: data.length
        });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${serviceMaster.api}/steps/${serviceId}/remove`, { ids: showConfirmBox.ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        fetchStepsData();
        setShowConfirmBox({ open: false, ids: null });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleArrangeUpdate = (rows: any[]) => {
    setIsAssigning(true);
    rows?.forEach((e: any) => {
      delete e.name;
    });
    axiosInstance()
      .put(`${serviceMaster.api}/steps/${serviceId}/order`, { data: rows || [] })
      .then(({ data }) => {
        fetchStepsData();
        setIsAssigning(false);
        setArrangeView(false);
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
      })
      .catch((err) => {
        setIsAssigning(false);
        toastConfig.setToastConfig(err);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setStepDialog({ open: true, stepId: '' });
          }}
        >
          Add Steps
        </MenuItem>
      </>
    );
  };

  const rightSideContents = () => {
    return (
      <>
        {dataRows?.length ? (
          <ThemeButton iconForMobile={<LowPriority />} onClick={() => setArrangeView(true)} mobileTooltip="Arrange" buttonType="default">
            <DragIndicatorIcon fontSize="small" className="mr-1 text-[var(--primary)] dark:text-white" /> Arrange
          </ThemeButton>
        ) : null}
        {!isMobile ? (
          <ImportExportMenu
            permissions={permissions?.serviceMaster}
            module="stpes"
            api={`${serviceMaster.api}/steps/${serviceId}`}
            afterImportCompleted={() => {
              fetchStepsData();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords.length}
            ids={selectedRecords?.length ? selectedRecords?.map((obj) => obj._id) : []}
            additionalParams={`serviceId=${serviceId}`}
          />
        ) : null}
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setStepFieldsDialog({ open: true, stepIds: selectedRecords?.map((e) => e._id) });
          }}
        >
          Add Bulk Fields
        </MenuItem>
        <MenuItem
          onClick={() => {
            setShowConfirmBox({ open: true, ids: selectedRecords?.map((e) => e._id) });
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <>
      {permissions?.serviceMaster?.isUpdate && (
        <>
          <DetailsPageHeader
            isAddButtonVisible
            addButtonMenuItems={addButtonMenuItems()}
            isActionButtonVisible
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: selectedRecords.length === 0 }}
            rightSideContents={rightSideContents()}
            hasXpadding={false}
          />
        </>
      )}
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
          refreshGrid={fetchStepsData}
          hideAction={permissions?.serviceMaster?.isUpdate ? false : true}
          hideSelection={permissions?.serviceMaster?.isUpdate ? false : true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showConfirmBox.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete this step(s)?`}
          okBtnLoading={false}
          onClose={() => {
            setShowConfirmBox({ open: false, ids: null });
          }}
          onOk={handleDelete}
        />
      )}
      {stepDialog.open && (
        <StepDialog
          handleClose={() => {
            setStepDialog({ open: false, stepId: '' });
          }}
          handleSucess={() => {
            setStepDialog({ open: false, stepId: '' });
            fetchStepsData();
          }}
          serviceId={serviceId}
          steps={dataRows}
          stepId={stepDialog.stepId}
        />
      )}
      {stepFieldsDialog.open && (
        <FieldDialog
          serviceIds={[serviceId]}
          stepIds={stepFieldsDialog.stepIds}
          handleClose={() => {
            setStepFieldsDialog({ open: false, stepIds: [] });
          }}
          handleSucess={() => {
            setStepFieldsDialog({ open: false, stepIds: [] });
            fetchStepsData();
          }}
        />
      )}
      {arrangeView && (
        <ArrangeView
          data={
            dataRows?.map((d) => {
              return { _id: d?._id, name: d?.stepName || '', order: d?.order };
            }) || []
          }
          title={'Arrange'}
          handleClose={() => setArrangeView(false)}
          handleSubmit={handleArrangeUpdate}
          loading={isAssigning}
        />
      )}
    </>
  );
};

export default Steps;
