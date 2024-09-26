import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { useData } from '../../../StateProvider/Provider';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import MangageDigitalDialog from './MangageDigitalDialog';

const Digital = ({ renderedFrom, productId }) => {
  const [digitalDialog, setDigitalDialog] = useState({ open: false, digitalId: '' });
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, ids: null });

  const {
    state: { permissions }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;
  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    let columns = [
      {
        accessor: 'title',
        Header: 'Title',
        width: 200,
        Cell: ({ row }) => {
          return row?.original?.title ? <p className="text-truncate">{row?.original?.title}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 200,
        Cell: ({ row }) => {
          return row?.original?.type ? <p className="text-truncate">{row?.original?.type}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'file',
        Header: 'Files',
        width: 200,
        Cell: ({ row }) => {
          return row?.original?.file ? <p className="text-truncate">{row?.original?.file}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'key',
        Header: 'Key',
        width: 200,
        Cell: ({ row }) => {
          return row?.original?.key ? <p className="text-truncate">{row?.original?.key}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'internal',
        Header: 'Internal',
        width: 200,
        Cell: ({ row }) => {
          return row?.original?.internal ? <p className="text-truncate">{row?.original?.internal}</p> : <NoDataCell />;
        }
      },
      ActionsRenderer
    ];
    setColumns(columns);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        {permissions?.product?.isUpdate && (
          <>
            <HtmlTooltip title="Edit">
              <IconButton
                aria-label="setting"
                onClick={(e) => {
                  setDigitalDialog({ open: true, digitalId: row?.original?._id });
                }}
                size="small"
              >
                <EditIcon color="primary" fontSize="small" />
              </IconButton>
            </HtmlTooltip>
            <HtmlTooltip title="Delete">
              <IconButton
                size="small"
                aria-label="Clone"
                onClick={() => {
                  setShowConfirmBox({ open: true, ids: [row?.original?._id] });
                }}
              >
                <DeleteIcon color="error" fontSize="small" />
              </IconButton>
            </HtmlTooltip>
          </>
        )}
      </>
    )
  };

  useEffect(() => {
    fetchDigitalData();
  }, [productId]);

  const fetchDigitalData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    axiosInstance()
      .get(`${routes.product.path}/${productId}/digital-product`)
      .then(({ data: { data } }) => {
        // data?.forEach((e: any) => {
        //   e.file = e?.file?.map((d) => d?.fileName)?.toString();
        // });
        dispatch({
          type: 'initialize',
          data: data,
          count: data?.length
        });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${routes.product.path}/${productId}/digital-product/remove`, { ids: showConfirmBox.ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        fetchDigitalData();
        setShowConfirmBox({ open: false, ids: null });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setDigitalDialog({ open: true, digitalId: '' });
          }}
        >
          Add File/Key
        </MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
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
      {permissions?.product?.isUpdate && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonMenuItems={addButtonMenuItems()}
            isActionButtonVisible={true}
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: selectedRecords.length === 0 }}
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
          refreshGrid={fetchDigitalData}
          isClientSideGrid={true}
          hideAction={!permissions?.product?.isUpdate}
          hideSelection={!permissions?.product?.isUpdate}
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
      {digitalDialog.open && (
        <MangageDigitalDialog
          open={true}
          digitalId={digitalDialog.digitalId}
          onClose={() => setDigitalDialog({ open: false, digitalId: '' })}
          productId={productId}
          onSuccess={() => {
            setDigitalDialog({ open: false, digitalId: '' });
            fetchDigitalData();
          }}
        />
      )}
    </>
  );
};

export default Digital;
