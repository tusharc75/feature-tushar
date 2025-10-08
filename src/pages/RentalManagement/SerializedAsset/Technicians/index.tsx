import { Autocomplete, Box, IconButton, MenuItem, TextField } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { AccessorFunction, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { fetch_rental_technician_fields } from 'src/components/RentalManagment/helper';
import { prepareDataForGrid, PRICING_SETUP_TYPE, rentalManagement, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { useData } from 'src/StateProvider/Provider';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Add } from '@mui/icons-material';
import ConfirmationDialog from '../../../../components/Helpers/ConfirmationDialog';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import AssignEmployeeDialog from 'src/components/AssignRolesDialog/AssignEmployeeDialog';
import dayjs from 'dayjs';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import { getCostPriceConditions, getCostPriceValue, getPricingConditions, getPricingValue } from 'src/components/PricingCondition';
import TechnicianAssign from 'src/components/TechnicianAssign';
import RentalTechnicianQtyDialog from 'src/pages/RentalManagement/SerializedAsset/Technicians/RentalTechnicianQtyDialog';
import { BulkActionContainer } from 'src/components/CustomReactTable/GridHeader';

const Technicians = ({ serviceOption, allowedToEdit, rentalManagementData, stepFullScreen, topLeftContent }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${camelCase(sidebarResource?.rentalManagement)}_assign_technician`;

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [selectedService, setSelectedService] = useState<{
    optionLabel: string;
    optionValue: string;
    _id?: string;
    competencyType?: string;
    competencies?: string[];
  }>({ optionLabel: 'All', optionValue: 'All' });
  const [technicianDialog, setTechnicianDialog] = useState(false);
  const [technicianAssign, setTechnicianAssign] = useState({ open: false, data: null });
  const [technicianEdit, setTechnicianEdit] = useState({ open: false, data: null, isBulkEdit: false, showSaveAndNext: false });
  const [isUpdating, setUpdating] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [allFields, setAllFields] = useState(null);

  const { isOffline } = useContext(CustomOfflineContext);
  const { generateColumns } = useColumns();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  useEffect(() => {
    fetchColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedService]);

  const openTechnician = (data, rows) => {
    setTechnicianEdit({
      open: true,
      data: data?.original?.orignalData,
      isBulkEdit: false,
      showSaveAndNext: data?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && data?.depth === 0 ? true : false
    });
  };

  const fetchColumns = async () => {
    let data = isOffline ? [] : await fetch_rental_technician_fields(rentalManagementData?.currency, false);
    let technicianFields = [];
    if (!isOffline) {
      const fieldLabelResponce = await axiosInstance().put(`/field/find-field-labels`, {
        fields: [
          {
            resource: sidebarResource.employeeMaster,
            fieldNames: ['competencyType', 'competencies']
          }
        ]
      });
      technicianFields = fieldLabelResponce?.data?.data?.find((e) => e.resource === sidebarResource.employeeMaster)?.fieldNames || [];
    }
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
      ...(technicianFields?.find((e) => e.fieldName === 'competencyType')
        ? [
            {
              accessor: 'competencyType',
              Header: technicianFields?.find((e) => e.fieldName === 'competencyType')?.fieldLabel,
              width: 250,
              Cell: ({ row }) => (
                <DropdownCell
                  permissions={permissions}
                  permissionForLinks={{}}
                  field={{
                    fieldName: 'competencyType',
                    lookupResource: sidebarResource.competencyType
                  }}
                  original={row?.original}
                />
              ),
              accessorFn: (original) => AccessorFunction(original, 'competencyType')
            }
          ]
        : []),
      ...(technicianFields?.find((e) => e.fieldName === 'competencies')
        ? [
            {
              accessor: 'competencies',
              Header: technicianFields?.find((e) => e.fieldName === 'competencies')?.fieldLabel,
              width: 250,
              Cell: ({ row }) => (
                <DropdownCell
                  permissions={permissions}
                  permissionForLinks={{}}
                  field={{
                    fieldName: 'competencies',
                    lookupResource: sidebarResource.competencies
                  }}
                  original={row?.original}
                />
              ),
              accessorFn: (original) => AccessorFunction(original, 'competencies')
            }
          ]
        : [])
    ];

    column.push({
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
                    disabled={!row?.original?.canDelete}
                    onClick={() => {
                      setDeleteData([row.original._id]);
                    }}
                  >
                    <DeleteIcon fontSize="small" color={row.original?.canDelete ? 'error' : 'disabled'} />
                  </IconButton>
                </span>
              </HtmlTooltip>
            ) : null}
          </>
        );
      }
    });

    const newColumns = generateColumns(
      renderedFrom,
      data?.filter((f) => f?.isRead && !['endDate', 'startDate'].includes(f?.fieldName)),
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
    let api = `/technician?referenceId=${rentalManagementData?._id}&referenceType=${sidebarResource.rentalManagement}`;
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
          let technicianName = u?.technician['firstName'] + ' ' + u?.technician['lastName'];
          res.orignalData = { ...u, technicianId: u?.technician['_id'], technicianName };
          res.index = i + 1;
          res.technicianName = technicianName;
          res.technicianId = u?.technician['_id'];
          res.competencyType = u?.technician?.competencyType;
          res.competencies = u?.technician?.competencies;
          res.canDelete = res?.canDelete;
          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAssign = async (rows) => {
    const technician: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.referenceId = rentalManagementData?._id;
      element.technician = d?._id;
      element.referenceNumber = `${resources?.rentalManagement?.titleSingular}-${rentalManagementData?.rentalJobName}`;
      element.uniqueId = selectedService?._id || null;
      element.materialId = d?.competenciesId;
      element.type = 'competency';
      element.competence = d?.competenciesId;
      element.service = selectedService?.optionValue !== 'All' ? selectedService?.optionValue : null;
      element.pricingMethod = d.pricingMethodMain && d.pricingMethodMain.length ? d.pricingMethodMain[0] : d.pricingMethod ? d.pricingMethod : '';
      element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
      element.warehouse = rentalManagementData?.warehouse?.optionValue;
      element.estimateStartDate = rentalManagementData?.estimateStartDate || dayjs.tz().toDate();
      element.estimateEndDate = rentalManagementData?.estimateEndDate || dayjs.tz().toDate();
      const calValues = autoCalculateSpecificFields({ pricingMethod: element.pricingMethod }, element, allFields);
      Object.assign(element, calValues);
      technician.push(element);
    });
    let priceData: any = await getPricingConditions(sidebarResource.rentalManagement, rentalManagementData, technician, PRICING_SETUP_TYPE.rent);
    let costPriceData: any = null;
    if (user?.user?.brandPolicy?.materialCostPrice) {
      costPriceData = await getCostPriceConditions(technician, sidebarResource.employeeMaster, rentalManagementData);
    }
    AddMaterial(technician, priceData, costPriceData);
  };

  const AddMaterial = async (technician, priceData, costPriceData = null) => {
    const tempMaterial = [...technician];
    tempMaterial.forEach((element) => {
      const calValues = getPricingValue(element, priceData, rentalManagementData?.currency, allFields);
      element.referenceId = rentalManagementData?._id;
      element.referenceType = sidebarResource.rentalManagement;
      Object.assign(element, calValues);
      delete element.materialId;
    });
    if (costPriceData) {
      tempMaterial.forEach((element) => {
        const calValues = getCostPriceValue(element, costPriceData, rentalManagementData?.currency, allFields, sidebarResource.employeeMaster);
        Object.assign(element, calValues);
      });
    }
    setTechnicianAssign({ open: true, data: tempMaterial });
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
            data: dataRows[rowIndex + 1]?.orignalData,
            isBulkEdit: false,
            showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
          });
        } else {
          setTechnicianEdit({ open: false, data: null, isBulkEdit: false, showSaveAndNext: false });
        }
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = async (rows) => {
    setIsDeleting(true);
    axiosInstance()
      .put(`/technician`, { ids: rows })
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

  return (
    <>
      <div className={'flex min-h-[32px] w-full flex-wrap items-center gap-2 py-2'}>
        {topLeftContent}
        <Autocomplete
          size="small"
          style={{ width: '300px' }}
          fullWidth
          options={serviceOption}
          autoHighlight
          value={selectedService}
          getOptionLabel={(option: any) => option?.optionLabel || ''}
          isOptionEqualToValue={(option, val) => (option ? option?.optionValue === val?.optionValue : false)}
          onChange={(_, val) => {
            let value = val;
            if (!val) {
              value = { optionLabel: 'All', optionValue: 'All' };
            }
            setSelectedService(value);
          }}
          renderInput={(params) => <TextField {...params} label={'Select Service'} variant="outlined" margin="none" />}
        />
      </div>
      {columns ? (
        <CustomReactTable
          height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          refreshGrid={fetchData}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
          hideSelection={!allowedToEdit}
          hideAction={!allowedToEdit}
          bulkActionItems={allowedToEdit ? <BulkActionItems selectedRecords={selectedRecords} setDeleteData={setDeleteData} /> : null}
          topLeftSlot={
            allowedToEdit ? (
              <ThemeButton startIcon={<Add />} onClick={() => setTechnicianDialog(true)}>
                Assign
              </ThemeButton>
            ) : null
          }
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {technicianDialog && (
        <AssignEmployeeDialog
          onSuccess={(data) => {
            handleAssign(data);
          }}
          handleClose={() => {
            setTechnicianDialog(false);
          }}
          warehouse={rentalManagementData?.warehouse?.optionValue}
          currentCompetencyType={selectedService?.competencyType}
          currentCompetencies={selectedService?.competencies}
        />
      )}
      {technicianAssign.open && (
        <TechnicianAssign
          allData={technicianAssign?.data}
          onlyEstimateDates={true}
          handleSuccess={() => {
            setTechnicianDialog(false);
            fetchData();
            setTechnicianAssign({ open: false, data: null });
          }}
          handleClose={() => {
            setTechnicianAssign({ open: false, data: null });
          }}
        />
      )}
      {technicianEdit.open && (
        <RentalTechnicianQtyDialog
          onClose={() => {
            setTechnicianEdit({ open: false, data: null, isBulkEdit: false, showSaveAndNext: false });
          }}
          technicianData={technicianEdit.data}
          rentalManagementData={rentalManagementData}
          handleUpdate={handleSaveData}
          loadingEdit={isUpdating}
          bulkEdit={technicianEdit.isBulkEdit}
          showSaveAndNext={technicianEdit.showSaveAndNext}
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

const BulkActionItems = ({ selectedRecords, setDeleteData }) => {
  return (
    <BulkActionContainer>
      <BulkActionContainer.Button
        disabled={selectedRecords?.some((e) => !e?.canDelete)}
        onClick={() => {
          setDeleteData(selectedRecords?.map((d) => d?._id));
        }}
      >
        Delete
      </BulkActionContainer.Button>
    </BulkActionContainer>
  );
};
