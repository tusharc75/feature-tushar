import Box from '@mui/material/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../../../../components/Helpers/CommonSkeleton';
import routes from '../../../../components/Helpers/Routes';
import Grid from '@mui/material/Grid2';
import axiosInstance from 'src/axios/axiosInstance';
import { prepareDataForGrid, rentalManagement, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Button, IconButton, Menu, MenuItem } from '@mui/material';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { useData } from 'src/StateProvider/Provider';
import { BiChevronDown } from 'react-icons/bi';
import ConfirmationDialog from '../../../../components/Helpers/ConfirmationDialog';
import AssignEmployeeDialog from 'src/components/AssignRolesDialog/AssignEmployeeDialog';
import { displayDate } from 'src/constants/helpers';
import { Add } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import { CustomOfflineContext } from '../../../../StateProvider/OfflineContext/OfflineContext';
import RentalTechnicianQtyDialog from './RentalTechnicianQtyDialog';
import { camelCase } from 'lodash';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { calculatePrice, fetch_rental_technician_fields } from 'src/components/RentalManagment/helper';
import { FiExternalLink } from 'react-icons/fi';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const Technicians = ({ allowedToEdit, rentalManagementData, selectedService, services }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${camelCase(sidebarResource?.rentalManagement)}_technician`;

  const [columns, setColumns] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [technicianDialog, setTechnicianDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [technicianEdit, setTechnicianEdit] = useState({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
  const open = Boolean(anchorEl);

  const { isOffline } = useContext(CustomOfflineContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const { generateColumns } = useColumns();
  const [allFields, setAllFields] = useState(null);

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, [selectedService, services]);

  const openTechnician = (data, rows) => {
    setTechnicianEdit({
      open: true,
      data: data.original,
      bulkedit: false,
      showSaveAndNext: data?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && data?.depth === 0 ? true : false
    });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${rentalManagement.api}/technician/${rentalManagementData._id}`, { technician: rows })
      .then(() => {
        setUpdating(false);
        fetchData();
        if (saveAndNext) {
          const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
          setTechnicianEdit({
            open: true,
            data: dataRows[rowIndex + 1],
            bulkedit: false,
            showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
          });
        } else {
          setTechnicianEdit({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
        }
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const fetchColumns = async () => {
    let data = isOffline ? [] : await fetch_rental_technician_fields(rentalManagementData?.currency, false);
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
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            {isOffline || !allowedToEdit || data?.length === 0 ? (
              <p>{row.original.technicianName}</p>
            ) : (
              <p
                onClick={() => {
                  openTechnician(row, table.getRowModel().rows);
                }}
                className="link text-truncate"
                title={row.original.detail}
              >
                {row.original?.technicianName}
              </p>
            )}
            {!isOffline && (
              <Box>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.employeeMasterDetail.path}/${row.original?.technicianId}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </Box>
            )}
          </div>
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
        Cell: ({ row, table }) => {
          return (
            <>
              {data?.length ? (
                <HtmlTooltip title={isOffline || !allowedToEdit ? '' : 'Edit'}>
                  <IconButton
                    size="small"
                    aria-label="Details"
                    disabled={isOffline || !allowedToEdit ? true : false}
                    onClick={() => {
                      openTechnician(row, table.getRowModel().rows);
                    }}
                  >
                    <EditIcon fontSize="small" color={isOffline || !allowedToEdit ? 'disabled' : 'primary'} />
                  </IconButton>
                </HtmlTooltip>
              ) : null}
              {allowedToEdit ? (
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
              ) : null}
            </>
          );
        }
      }
    ];
    const newColumns = generateColumns(
      renderedFrom,
      data?.filter((f) => f?.isRead),
      null,
      false,
      rentalManagementData?.currency
    );
    setAllFields(data);
    setColumns([...column, ...newColumns]);
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
          res.competenciesWithIds = u?.technician['competencies'];
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

  const handleAssign = async (rows) => {
    const technician: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.rentalJob = rentalManagementData?._id;
      element.technician = d?._id;
      element.uniqueId = selectedService?._id || '';
      element.materialId = d?.competenciesId;
      element.type = 'competency';
      element.competence = d?.competenciesId;
      element.service = selectedService?.optionValue !== 'All' ? selectedService?.optionValue : null;
      element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : d.pricingMethod ? d.pricingMethod : '';
      element.status = 'Assigned';
      element.warehouse = rentalManagementData?.warehouse?.optionValue;
      element.startDate = rentalManagementData?.estimateStartDate || new Date();
      element.endDate = rentalManagementData?.estimateEndDate || new Date();
      const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
      element.duration = 1;
      if (calValues && calValues['duration']) {
        element.duration = calValues['duration'];
      }
      technician.push(element);
    });

    const priceData = (await calculatePrice(rentalManagementData, technician)) || [];
    AddMaterial(technician, priceData);
  };

  const AddMaterial = async (technician, priceData) => {
    const tempMaterial = [...technician];
    tempMaterial.forEach((element) => {
      const rateResult = priceData?.filter((e) => e.materialId === element.materialId && e.materialType === element.type);
      if (rateResult.length && rateResult[0].mrp) {
        const priceFieldName = `price_${rentalManagementData?.currency?.toLowerCase()}`;
        element[priceFieldName] = rateResult[0].mrp;
        element['pricingCondition'] = rateResult[0].conditionId;
        element['pricingMethod'] = rateResult[0].pricingMethod?.trim();
        const calValues = autoCalculateSpecificFields(
          { [priceFieldName]: rateResult[0].mrp, pricingMethod: element.pricingMethod },
          element,
          allFields
        );
        Object.assign(element, calValues);
      }
      delete element.materialId;
    });

    axiosInstance()
      .post(`${rentalManagement.api}/technician`, { technician: tempMaterial })
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
            <Box display="flex" gap={'8px'} flexWrap={'wrap'}>
              <Button variant="outlined" color="primary" size="small" startIcon={<Add />} onClick={() => setTechnicianDialog(true)}>
                Add
              </Button>
            </Box>
            <Box display="flex" ml={1}>
              <ThemeButton
                mobileTooltip="Actions"
                borderColor="yellow"
                backgroundColor="yellow"
                iconForMobile={<BiChevronDown />}
                id="demo-positioned-button"
                onClick={handleClick}
                disabled={!Boolean(selectedRecords?.length)}
                endIcon={<BiChevronDown />}
              >
                Actions
              </ThemeButton>
              <Menu
                anchorEl={anchorEl}
                keepMounted
                open={open}
                onClose={handleClose}
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
          <Grid size={{xs:12, md:12, sm:12}}>
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
          warehouse={rentalManagementData?.warehouse?.optionValue}
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
      {technicianEdit.open && (
        <RentalTechnicianQtyDialog
          onClose={() => {
            setTechnicianEdit({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
            setIsBulkEdit(false);
          }}
          technicianData={{
            ...technicianEdit.data,
            pricingCondition: technicianEdit.data?.pricingConditionId,
            competence: technicianEdit.data?.competenceId
          }}
          rentalManagementData={rentalManagementData}
          handleUpdate={handleSaveData}
          loadingEdit={isUpdating}
          bulkEdit={isBulkEdit}
          showSaveAndNext={technicianEdit.showSaveAndNext}
        />
      )}
    </>
  );
};

export default Technicians;
