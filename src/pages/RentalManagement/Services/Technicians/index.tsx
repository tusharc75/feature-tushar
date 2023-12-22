import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../../../../components/Helpers/CommonSkeleton';
import routes from '../../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import { prepareDataForGrid, rentalManagement } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { useData } from 'src/StateProvider/Provider';
import { BiChevronDown } from 'react-icons/bi';
import ConfirmationDialog from '../../../../components/Helpers/ConfirmationDialog';
import AssignEmployeeDialog from 'src/components/AssignRolesDialog/AssignEmployeeDialog';
import { displayDate } from 'src/constants/helpers';
import { Add } from '@material-ui/icons';

const Technicians = ({ allowedToEdit, rentalManagementData, selectedService, services }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = 'rentalJob_technician';

  const [columns, setColumns] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [technicianDialog, setTechnicianDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, [selectedService, services]);

  const fetchColumns = async () => {
    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'technicianName',
        Header: 'Name',
        width: 250,
        Cell: ({ row }) => (
          <a className="link text-truncate" href={`${routes.employeeMasterDetail.path}/${row.original?.technicianId}`} target="_blank">
            {row.original?.technicianName}
          </a>
        )
      },
      {
        accessor: 'service',
        Header: 'Service',
        width: 250,
        Cell: ({ row }) =>
          row.original?.service ? (
            <a className="link text-truncate" href={`${routes.serviceMasterDetail.path}/${row.original?.serviceId}`} target="_blank">
              {row.original?.service}
            </a>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 200,
        Cell: ({ row }) => (row.original['status'] ? <p>{row.original?.status}</p> : <NoDataCell />)
      },
      {
        accessor: 'competencyType',
        Header: 'Competency Type',
        width: 250,
        Cell: ({ row }) => (row.original['competencyType'] ? <p>{row.original?.competencyType}</p> : <NoDataCell />)
      },
      {
        accessor: 'competencies',
        Header: 'Competencies',
        width: 250,
        Cell: ({ row }) => (row.original['competencies'] ? <p>{row.original?.competencies}</p> : <NoDataCell />)
      },
      {
        accessor: 'startDate',
        Header: 'Start Date',
        width: 250,
        Cell: ({ row }) => (row.original?.startDate ? <p>{displayDate(row.original?.startDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'endDate',
        Header: 'End Date',
        width: 250,
        Cell: ({ row }) => (row.original?.endDate ? <p>{displayDate(row.original?.endDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'action',
        Header: 'Actions',
        minWidth: 100,
        width: 100,
        sticky: 'right',
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        Cell: ({ row }) => {
          return allowedToEdit ? (
            <HtmlTooltip title={'Delete'}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Details"
                  onClick={() => {
                    setDeleteData([{ id: row.original._id }]);
                  }}
                >
                  <DeleteIcon fontSize="small" color={'error'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          ) : null;
        }
      }
    ];
    setColumns(column);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    let api = `${rentalManagement.api}/technician?rentalJobId=${rentalManagementData?._id}`;
    if (selectedService && selectedService?.optionValue !== 'All') {
      api = `${api}&serviceId=${selectedService?.optionValue}&uniqueId=${selectedService?._id}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        let rows = data?.technician?.map((u, i) => {
          let res: any = {
            ...prepareDataForGrid(u)
          };
          res.index = i + 1;
          res.technicianName = u?.technician['firstName'] + ' ' + u?.technician['lastName'];
          res.technicianId = u?.technician['_id'];
          res.competencyType = u?.technician['competencyType']?.optionLabel;
          res.competencies = u?.technician['competencies']?.map((e) => e?.optionLabel)?.toString();
          return res;
        });

        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async (rows) => {
    setIsDeleting(true);
    axiosInstance()
      .put(`${rentalManagement.api}/technician`, { ids: rows })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setIsDeleting(false);
        fetchData();
        setDeleteData(null);
      })
      .catch((error) => {
        setIsDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const handleAssign = (rows) => {
    const technician: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.rentalJob = rentalManagementData?._id;
      element.technician = d?._id;
      element.uniqueId = selectedService?._id;
      element.service = selectedService?.optionValue !== 'All' ? selectedService?.optionValue : null;
      element.status = 'Assigned';
      element.startDate = rentalManagementData?.estimateStartDate || new Date();
      element.endDate = rentalManagementData?.estimateEndDate || new Date();
      technician.push(element);
    });
    axiosInstance()
      .post(`${rentalManagement.api}/technician`, { technician })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setTechnicianDialog(false);
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      <Box className="container-with-border" p={2} style={{ WebkitBorderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        {allowedToEdit && (
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Box display="flex" gridGap={'8px'} flexWrap={'wrap'}>
              <Button variant="outlined" color="primary" size="small" startIcon={<Add />} onClick={() => setTechnicianDialog(true)}>
                Add
              </Button>
            </Box>
            <Box display="flex" ml={1}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                id="demo-positioned-button"
                onClick={handleClick}
                disabled={!Boolean(selectedRecords?.length)}
                endIcon={<BiChevronDown />}
                className="new-dropdown-v1"
              >
                Actions
              </Button>
              <Menu
                anchorEl={anchorEl}
                keepMounted
                open={open}
                onClose={handleClose}
                getContentAnchorEl={null}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
              >
                <HtmlTooltip title={Boolean(selectedRecords.length) ? 'Delete selected records' : 'Select records to delete'}>
                  <MenuItem
                    disabled={isDeleting}
                    onClick={() => {
                      setDeleteData(
                        selectedRecords?.map((d) => {
                          return {
                            id: d?._id
                          };
                        })
                      );
                      handleClose();
                    }}
                  >
                    Delete
                  </MenuItem>
                </HtmlTooltip>
              </Menu>
            </Box>
          </Box>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} md={12} sm={12}>
            {columns && dataRows ? (
              <CustomReactTable
                height={'300px'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                refreshGrid={fetchData}
                renderedFrom={renderedFrom}
                isClientSideGrid={true}
                hideSelection={!allowedToEdit}
                hideAction={!allowedToEdit}
              />
            ) : (
              <Box p={2} height={300}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>

      {technicianDialog && (
        <AssignEmployeeDialog
          reference={'fieldTicket'}
          onSuccess={(data) => {
            handleAssign(data);
          }}
          handleClose={() => {
            setTechnicianDialog(false);
          }}
          defaultCompetency={[]}
          ids={[]}
        />
      )}

      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete the record(s)?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}
    </>
  );
};

export default Technicians;
