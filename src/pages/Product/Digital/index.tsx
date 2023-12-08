import { useState, useEffect, useContext } from 'react';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTableNew';
import { Box, Grid, IconButton, Menu, MenuItem, Button } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from '../../../StateProvider/Provider';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import EditIcon from '@material-ui/icons/Edit';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { ExpandMore } from '@material-ui/icons';
import MangageDigitalDialog from './MangageDigitalDialog';
import routes from 'src/components/Helpers/Routes';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const Digital = ({ renderedFrom, productId }) => {
  const [digitalDialog, setDigitalDialog] = useState({ open: false, digitalId: '' });
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, ids: null });

  const {
    state: { permissions }
  }: any = useData();
  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;
  const toastConfig = useContext(CustomToastContext);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
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

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  return (
    <>
      {permissions?.product?.isUpdate && (
        <Box p={1}>
          <Grid container>
            <Grid item xs={6} md={6} sm={6}>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => {
                  setDigitalDialog({ open: true, digitalId: '' });
                }}
              >
                Add File/Key
              </Button>
            </Grid>
            <Grid item xs={6} md={6} sm={6}>
              <Box display={'flex'} justifyContent={'flex-end'}>
                <Button
                  variant="outlined"
                  color="default"
                  size="small"
                  onClick={openActions}
                  aria-controls="action-menu"
                  disabled={selectedRecords.length === 0}
                  endIcon={<ExpandMore />}
                  className="new-dropdown-v1"
                >
                  Actions
                </Button>
                <Menu
                  anchorEl={anchorActionEl}
                  keepMounted
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  id="action-menu"
                  open={Boolean(anchorActionEl)}
                  onClose={closeActions}
                >
                  <MenuItem
                    onClick={() => {
                      closeActions();
                      setShowConfirmBox({ open: true, ids: selectedRecords?.map((e) => e._id) });
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
              </Box>
            </Grid>
          </Grid>
        </Box>
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
