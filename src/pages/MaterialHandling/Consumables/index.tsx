import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import { camelCase, set, uniqueId } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Button, CircularProgress, IconButton, Menu, MenuItem, Tooltip, Typography } from '@material-ui/core';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import { isMobile, isTablet } from 'react-device-detect';
import moment from 'moment';
import { dateFormat } from 'src/constants/helpers';
import CancelIcon from '@material-ui/icons/Cancel';
import CheckCircleIcon from '@material-ui/icons//CheckCircle';
import axiosInstance from 'src/axios/axiosInstance';
import { ExpandMore } from '@material-ui/icons';

const Consumables = ({ selectedFieldService, recall, style }) => {
  let renderedFrom = camelCase(routes?.materialHandling.title + '_consumables');
  const toastConfig = useContext(CustomToastContext);
  const [dataRows, setDataRows] = useState(null);
  const [columns, setColumns] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoadingState, setIsLoadingState] = useState({ loading: false, status: null, id: null });

  useEffect(() => {
    fetchData();
  }, [selectedFieldService]);

  const handleUpdateStatus = (status, requestLogs, id) => {
    setIsLoadingState({ loading: true, id, status });
    const data = {
      status,
      qtyRequestLogs:
        requestLogs?.map((i) => {
          return {
            _id: i._id,
            qty: i.qty,
            uniqueId: i?.uniqueId
          };
        }) || []
    };
    axiosInstance()
      .put(`/material-handling/status/${selectedFieldService._id}`, data)
      .then((res) => {
        recall();
        setSelectedRecords([]);
        setIsLoadingState({ loading: false, id: null, status: null });
      })
      .catch((err) => {
        console.log(err);
        toastConfig.setToastConfig(err);
        setIsLoadingState({ loading: false, id: null, status: null });
      });
  };

  // const fetchColumns = () => {
  //   const column: any = [
  //     {
  //       accessor: 'product',
  //       Header: 'Product',
  //       width: 100,
  //       sticky: isMobile ? 'none' : 'left',
  //       Cell: ({ row }) =>
  //         row?.original?.product ? (
  //           <p className="text-truncate" title={row?.original?.product}>
  //             <a className="link text-truncate" href={`${routes.productDetail.path}/${row.original.product}`} target="_blank">
  //               {row.original.productName}
  //             </a>
  //           </p>
  //         ) : (
  //           <NoDataCell />
  //         )
  //     },
  //     {
  //       accessor: 'productDescription',
  //       Header: 'Description',
  //       width: 100,
  //       Cell: ({ row }) =>
  //         row.original.productDetail?.productDescription ? (
  //           <p className="text-truncate">{row.original.product?.productDescription}</p>
  //         ) : (
  //           <NoDataCell />
  //         )
  //     },
  //     {
  //       accessor: 'qty',
  //       Header: 'Qty',
  //       editable: false,
  //       width: 80,
  //       Cell: ({ row }) => <p className="text-truncate">{row?.original?.qty || <NoDataCell />}</p>
  //     },
  //     {
  //       accessor: 'status',
  //       Header: 'Status',
  //       editable: false,
  //       width: 130,
  //       Cell: ({ row }) => <p className="text-truncate">{row?.original?.status || <NoDataCell />}</p>
  //     },
  //     {
  //       accessor: 'requestBy',
  //       Header: 'Requested By',
  //       editable: false,
  //       width: 150,
  //       Cell: ({ row }) =>
  //         row?.original?.requestBy?.optionLabel ? (
  //           <p className="text-truncate" title={row?.original?.requestBy?.optionLabel}>
  //             <a className="link text-truncate" href={`${routes.userDetail.path}/${row?.original?.requestBy?.optionValue}`} target="_blank">
  //               {row?.original?.requestBy?.optionLabel}
  //             </a>
  //           </p>
  //         ) : (
  //           <NoDataCell />
  //         )
  //     },
  //     {
  //       accessor: 'requestDate',
  //       Header: 'Request Date',
  //       editable: false,
  //       width: 150,
  //       Cell: ({ row }) => <p className="text-truncate">{moment(row.original?.requestDate).format(dateFormat) || <NoDataCell />}</p>
  //     }
  //   ];
  //   column?.push({
  //     accessor: 'action',
  //     Header: 'Action',
  //     minWidth: 120,
  //     width: 120,
  //     sticky: 'right',
  //     disableFilters: true,
  //     canDrag: false,
  //     Cell: ({ row }) =>
  //       row?.original?.status === 'Requested' ? (
  //         <Fragment>
  //           <Tooltip title="Processed">
  //             <Button
  //               onClick={() => {
  //                 handleUpdateStatus('Processed', [row.original]);
  //               }}
  //               size="small"
  //             >
  //               <CheckCircleIcon fontSize="small" color="primary" />
  //             </Button>
  //           </Tooltip>
  //           <Tooltip title="Reject">
  //             <Button
  //               onClick={() => {
  //                 handleUpdateStatus('Rejected', [row.original]);
  //               }}
  //               size="small"
  //             >
  //               <CancelIcon fontSize="small" color="error" />
  //             </Button>
  //           </Tooltip>
  //         </Fragment>
  //       ) : null
  //   });
  //   setColumns(column);
  // };

  const fetchData = () => {
    setDataRows(null);
    const consumableData = selectedFieldService?.qtyRequestLogs?.map((u) => {
      let res: any = {
        ...u,
        productName: u?.product?.optionLabel
      };
      return res;
    });

    setDataRows(consumableData || []);
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {/* <Box display="flex" justifyContent="flex-end" p={2} pt={0} marginY={2}>
        <Box display="flex" ml={1}>
          <Button
            variant={isMobile && !isTablet ? 'text' : 'outlined'}
            color="default"
            size="small"
            onClick={openActions}
            aria-controls="action-menu"
            disabled={selectedRecords.length > 0 ? false : true}
            className={isMobile && !isTablet && 'mobile_button'}
            endIcon={<ExpandMore />}
          >
            {isMobile && !isTablet ? '' : 'Actions'}
          </Button>
          <Menu
            anchorEl={anchorEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            id="action-menu"
            open={Boolean(anchorEl)}
            onClose={closeActions}
          >
            <MenuItem
              onClick={(e) => {
                e?.preventDefault();
                handleUpdateStatus('Processed', selectedRecords);
              }}
            >
              Process
            </MenuItem>
            <MenuItem
              onClick={(e) => {
                e?.preventDefault();
                handleUpdateStatus('Rejected', selectedRecords);
              }}
            >
              Reject
            </MenuItem>
          </Menu>
        </Box>
      </Box> */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={12} sm={12}>
          {dataRows ? (
            dataRows?.map((u, index) => {
              return (
                <Box
                  mb={2}
                  key={index}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    color: 'black',
                    border: '1px solid #ebebeb',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box p={3}>
                    <Box sx={style.serviceHead}>
                      <Typography>
                        Product:{' '}
                        <a className="link text-truncate" href={`${routes.productDetail.path}/${u?.product?.optionValue}`} target="_blank">
                          <span>{u?.productName}</span>
                        </a>
                      </Typography>
                    </Box>
                    <Box sx={style.serviceItem}>
                      <Typography>Qty: {u?.qty}</Typography>
                    </Box>
                    <Box sx={style.serviceItem}>
                      <Typography>Status: {u?.status}</Typography>
                    </Box>
                    <Box sx={style.serviceItem}>
                      <Typography>
                        Requested By:
                        <a className="link text-truncate" href={`${routes.userDetail.path}/${u?.requestBy?.optionValue}`} target="_blank">
                          {u?.requestBy?.optionLabel}
                        </a>
                        on {moment(u?.requestDate)?.format(dateFormat)}
                      </Typography>
                    </Box>
                    {u?.responseBy && (
                      <Box sx={style.serviceItem}>
                        <Typography>
                          Responsed By:
                          <a className="link text-truncate" href={`${routes.userDetail.path}/${u?.responseBy?.optionValue}`} target="_blank">
                            {u?.responseBy?.optionLabel}
                          </a>
                          on {moment(u?.responseDate)?.format(dateFormat)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  {u?.status === 'Requested' ? (
                    <Box p={3}>
                      <Box sx={style.serviceHead}>
                        <Button
                          disabled={isLoadingState.loading}
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => {
                            handleUpdateStatus('Processed', [u], u?._id);
                          }}
                        >
                          {isLoadingState.id === u?._id && isLoadingState?.status === 'Processed' ? <CircularProgress size={20} /> : 'Process'}
                        </Button>
                      </Box>
                      <Box sx={style.serviceItem}>
                        <Button
                          disabled={isLoadingState.loading}
                          variant="outlined"
                          color="secondary"
                          size="small"
                          onClick={() => {
                            handleUpdateStatus('Rejected', [u], u?._id);
                          }}
                        >
                          {isLoadingState.id === u?._id && isLoadingState?.status === 'Rejected' ? <CircularProgress size={20} /> : 'Reject'}
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box />
                  )}
                </Box>
              );
            })
          ) : (
            <Box p={2} height={500} bgcolor="white">
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default Consumables;
