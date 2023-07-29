import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { dateTimeFormat, fieldServiceOrder } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { BiChevronDown } from 'react-icons/bi';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import SendIcon from '@material-ui/icons/Send';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import DispatchMaterial from './DispatchMaterial';
import moment from 'moment';

const TechnicianDispatch = ({ serviceOrderData, setNextStep, renderedFrom, stepFullScreen, allowedToEdit }: any) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showDispatchMaterial, setShowDispatchMaterial] = useState({ open: false, data: [] });

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchData();
  }, [columns]);

  const fetchFields = async () => {
    const column: any = [
      {
        accessor: 'service',
        Header: ' Service',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {row.original?.service?.serviceName}
            <IconButton
              size="small"
              style={{ marginLeft: '10px' }}
              onClick={() => {
                window.open(`${routes.serviceMasterDetail.path}/${row.original?.service?._id}`);
              }}
            >
              <OpenInNewIcon fontSize="small" color="primary" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'technician',
        Header: 'Technician',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {`${row.original?.technician?.firstName} ${row.original?.technician?.lastName} - (${row.original?.technician?.employeeNumber})`}
            <IconButton
              size="small"
              style={{ marginLeft: '10px' }}
              onClick={() => {
                window.open(`${routes.employeeMasterDetail.path}/${row.original?.technician?._id}`);
              }}
            >
              <OpenInNewIcon fontSize="small" color="primary" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 200,
        Cell: ({ row }) => {
          return row.original['status'] ? <p className="text-truncate">{row.original.status}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'estimateStartDate',
        Header: 'Estimate Start Date',
        width: 200,
        Cell: ({ row }) => {
          return row.original['estimateStartDate'] ? <p>{moment(row.original['estimateStartDate']).format(dateTimeFormat)}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'estimateEndDate',
        Header: 'Estimate End Date',
        width: 200,
        Cell: ({ row }) => {
          return row.original['estimateEndDate'] ? <p>{moment(row.original['estimateEndDate']).format(dateTimeFormat)}</p> : <NoDataCell />;
        }
      }
    ];
    column.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 50,
      width: 50,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => {
        return allowedToEdit ? (
          row.original.status === 'Assigned' ? (
            <HtmlTooltip title={'Dispatch'}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Dispatch"
                  onClick={() => {
                    const obj: any = [
                      {
                        _id: row.original._id,
                        technician: row.original?.technician?._id,
                        material: row.original?.material
                      }
                    ];
                    if (row.original?.material?.length) {
                      setShowDispatchMaterial({ open: true, data: obj });
                    } else {
                      handleDispatch(obj);
                    }
                  }}
                >
                  <SendIcon fontSize="small" color={'primary'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          ) : row.original.status === 'Dispatched' ? (
            <HtmlTooltip title={'Complete'}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Complete"
                  onClick={() => {
                    const obj: any = [{ _id: row.original._id, technician: row.original?.technician?._id }];
                    handleCompleted(obj);
                  }}
                >
                  <CheckCircleIcon fontSize="small" color={'primary'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          ) : null
        ) : null;
      }
    });
    setColumns(column);
  };

  const fetchData = async () => {
    setNextStep(false);

    var data: any = [];
    const response = await axiosInstance().get(`${fieldServiceOrder.api}/${serviceOrderData._id}/material`);
    data = response?.data?.data?.material;

    const responseTechnician = await axiosInstance().get(`${fieldServiceOrder.api}/${serviceOrderData._id}/technician`);
    const technician = responseTechnician?.data?.data;

    const rows: any = [];

    data
      .filter((e) => e.parentId === null && e.type === 'service')
      .forEach((parent, i) => {
        technician
          .filter((e) => e.uniqueId === parent._id)
          ?.forEach((element, i) => {
            const obj: any = {};
            obj._id = element._id;
            // obj._id = parent._id;
            obj.service = parent.serviceDetail;
            obj.technician = element?.technician;
            obj.estimateStartDate = element?.estimateStartDate;
            obj.estimateEndDate = element?.estimateEndDate;
            obj.material = data?.filter((ele) => ele.parentId === parent._id && ele.type === 'product');
            obj.status = element?.status;
            rows.push(obj);
          });
      });
    if (rows.some((d) => d.status !== 'Completed')) {
      setNextStep(false);
    } else {
      setNextStep(true);
    }
    setRowsData(rows);
    setSelectedRecords([]);
  };

  const handleDispatch = (rows) => {
    axiosInstance()
      .put(`${fieldServiceOrder.api}/${serviceOrderData?._id}/technician/dispatched`, rows)
      .then(({ data }) => {
        setShowDispatchMaterial({ open: false, data: [] });
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

  const handleCompleted = (rows) => {
    axiosInstance()
      .put(`${fieldServiceOrder.api}/${serviceOrderData?._id}/technician/complete`, rows)
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

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Fragment>
      <Grid container spacing={2}>
        {allowedToEdit && (
          <Grid item xs={12} md={12} sm={12}>
            <Box display="flex" justifyContent="space-between" m={1} mb={0}>
              <Box display="flex"></Box>
              <Box display="flex">
                <Button
                  variant={'outlined'}
                  color="primary"
                  size="small"
                  onClick={handleClick}
                  disabled={!Boolean(selectedRecords && selectedRecords.length)}
                  endIcon={<BiChevronDown />}
                  className="new-dropdown-v1"
                >
                  Actions
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  onClose={handleClose}
                >
                  <MenuItem
                    disabled={selectedRecords?.filter((e) => e.status === 'Assigned')?.length === selectedRecords?.length ? false : true}
                    onClick={() => {
                      const obj: any = selectedRecords.map((ele) => {
                        return {
                          _id: ele?._id,
                          technician: ele?.technician?._id,
                          material: ele?.material?.map((e) => {
                            return { _id: e._id, type: 'product', product: e.materialId };
                          })
                        };
                      });
                      handleDispatch(obj);
                      handleClose();
                    }}
                  >
                    Dispatched
                  </MenuItem>
                  <MenuItem
                    disabled={selectedRecords?.filter((e) => e.status === 'Dispatched')?.length === selectedRecords?.length ? false : true}
                    onClick={() => {
                      const obj: any = selectedRecords.map((ele) => {
                        return { _id: ele?._id, technician: ele?.technician?._id };
                      });
                      handleCompleted(obj);
                      handleClose();
                    }}
                  >
                    Completed
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          </Grid>
        )}
        <Grid item xs={12} md={12} sm={12}>
          {columns && rowsData ? (
            <Box zIndex={5} width={'100%'} height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}>
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                columns={columns}
                data={rowsData}
                onSelect={setSelectedRecords}
                childrenProperty="subRows"
                uniqueKey="_id"
                hideSelection={!allowedToEdit}
                hideAction={!allowedToEdit}
                renderedFrom={`${renderedFrom}_technician`}
                isClientSideGrid={true}
                hideExpander={true}
              />
            </Box>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
      {showDispatchMaterial.open && (
        <DispatchMaterial
          handleClose={() => {
            setShowDispatchMaterial({ open: false, data: [] });
          }}
          data={showDispatchMaterial.data}
          handleSubmit={(rows) => {
            handleDispatch(rows);
          }}
        />
      )}
    </Fragment>
  );
};

export default TechnicianDispatch;
