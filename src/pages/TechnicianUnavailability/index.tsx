import { useState, useEffect, useContext } from 'react';
import { Autocomplete, Box, IconButton, MenuItem, TextField } from '@mui/material';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { camelCase } from 'lodash';
import { employeeMaster, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { Delete, Edit, FileCopy } from '@mui/icons-material';
import ManageUnavailability from './Manage';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import axios, { CancelTokenSource } from 'axios';
import { cloneDisable, deleteDisable, editDisable } from 'src/constants/messageHelpers';
import { ListingPageHeader } from 'src/components/PageHeaders';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CustomContainer from 'src/components/CustomContainer';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { DetailsPageHeader } from 'src/components/PageHeaders';

let employeeUnavailabilityTimeout;

const TechnicianUnavailability = ({ id }: { id?: string | null }) => {
  const renderedFrom = id ? `${camelCase(sidebarResource.employeeMaster)}_Unavailability` : `${camelCase(sidebarResource.technicianUnavailability)}`;

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [showUnavailbiltyDialog, setShowUnavailibilityDialog] = useState({ open: false, id: null, isClone: false });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState({ open: false, data: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [columns, setColumns] = useState(null);
  const [technicians, setTechnicians] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
    if (!id) {
      fetchTechnician();
    }
  }, []);

  const fetchTechnician = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${employeeMaster.api}`);
      const technicians = data?.data?.map((d) => ({
        optionValue: d?._id,
        optionLabel: d?.firstName + ' ' + d?.lastName
      }));
      setTechnicians(technicians);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.technicianUnavailability}`);
    data = response?.data?.data;
    if (id) {
      data = data?.filter((d) => d?.fieldData?.fieldName !== 'technician');
    }
    let newColumns = generateColumns(renderedFrom, data, routes.technicianUnavailabilityDetail.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

  const ActionsRenderer = {
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
        <HtmlTooltip title={permissions?.technicianUnavailability?.isUpdate ? 'Edit' : editDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Edit"
              disabled={permissions?.technicianUnavailability?.isUpdate ? false : true}
              onClick={() => {
                setShowUnavailibilityDialog({ open: true, id: row.original._id, isClone: false });
              }}
            >
              <Edit fontSize="small" color={permissions?.technicianUnavailability?.isUpdate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        {!id && (
          <HtmlTooltip title={permissions?.technicianUnavailability?.isCreate ? 'Clone' : cloneDisable}>
            <span>
              <IconButton
                size="small"
                aria-label="Clone"
                disabled={permissions?.technicianUnavailability?.isCreate ? false : true}
                onClick={() => {
                  setShowUnavailibilityDialog({ open: true, id: row.original._id, isClone: true });
                }}
              >
                <FileCopy fontSize="small" color={permissions?.technicianUnavailability?.isCreate ? 'primary' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        )}
        <HtmlTooltip title={permissions?.technicianUnavailability?.isDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={permissions?.technicianUnavailability?.isDelete ? false : true}
              onClick={() => {
                setShowDeleteConfirmBox({ open: true, data: row.original });
              }}
            >
              <Delete fontSize="small" color={permissions?.technicianUnavailability?.isDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (employeeUnavailabilityTimeout) {
      clearTimeout(employeeUnavailabilityTimeout);
    }
    employeeUnavailabilityTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly, selectedTechnician]);

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    if (id) {
      deepFilter = `${deepFilter}&technician=${id}`;
    } else if (selectedTechnician) {
      deepFilter = `${deepFilter}&technician=${selectedTechnician}`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);
    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    try {
      let data: any = [];
      const response: any = await axiosInstance().get(`/employee-master-unavailability${queryString}`, {
        cancelToken: cancelTokenSource?.token
      });
      data = response?.data?.data;
      let rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: response?.data?.count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = async (data = null) => {
    let recordsToDelete = [];
    if (data) {
      recordsToDelete.push(data?._id);
    } else if (selectedRecords?.length) {
      recordsToDelete = selectedRecords?.map((r) => r?._id);
    }
    if (recordsToDelete.length > 0) {
      setDeleteLoading(true);
      axiosInstance()
        .put(`/employee-master-unavailability/remove`, {
          ids: recordsToDelete
        })
        .then(({ data }) => {
          dispatch({ type: 'selection', selectedRecords: [] });
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setShowDeleteConfirmBox({ open: false, data: null });
          setDeleteLoading(false);
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setShowDeleteConfirmBox({ open: false, data: null });
          setDeleteLoading(false);
        });
    }
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setShowDeleteConfirmBox({ open: true, data: null });
          }}
          disabled={!selectedRecords?.length}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  const leftSideContent = () => {
    return (
      <Autocomplete
        style={{ minWidth: '200px', flexGrow: 1 }}
        className="md:max-w-[250px]"
        options={technicians || []}
        getOptionLabel={(option: any) => option.optionLabel || ''}
        isOptionEqualToValue={(option: any, val) => option.optionValue === val.optionValue}
        size={'small'}
        value={technicians?.find((data) => data?.optionValue === selectedTechnician) || null}
        onChange={(e, val) => {
          setSelectedTechnician(val?.optionValue || null);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            margin="none"
            size="small"
            name="technician"
            label={resources?.technician?.titleSingular}
            variant="outlined"
            fullWidth
            placeholder="Select Technician"
          />
        )}
      />
    );
  };

  return (
    <section className="main-container-v1">
      {!id && (
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{ ...routes.technicianUnavailability, title: resources?.technicianUnavailability?.titlePlural }]} />
        </div>
      )}
      <CustomContainer>
        {!id ? (
          <ListingPageHeader
            searchValue={search}
            onSearch={handleSearch}
            isActionButtonVisible={permissions?.technicianUnavailability?.isDelete}
            actionButtonProps={{
              disabled: !selectedRecords?.length
            }}
            actionMenuItems={actionButtonMenuItems()}
            addButtonOnclick={() => {
              setShowUnavailibilityDialog({ open: true, id: null, isClone: false });
            }}
            isAddButtonVisible={permissions?.technicianUnavailability?.isCreate}
            addButtonProps={{
              onClick: () => {
                setShowUnavailibilityDialog({ open: true, id: null, isClone: false });
              }
            }}
            leftSideContents={!id ? leftSideContent() : null}
          />
        ) : (
          <DetailsPageHeader
            isAddButtonVisible={permissions?.technicianUnavailability?.isCreate}
            addButtonProps={{
              onClick: () => {
                setShowUnavailibilityDialog({ open: true, id: null, isClone: false });
              }
            }}
            isActionButtonVisible={permissions?.technicianUnavailability?.isDelete}
            actionButtonProps={{
              disabled: !selectedRecords?.length
            }}
            actionButtonMenuItems={actionButtonMenuItems()}
            hasXpadding={false}
          />
        )}
        {columns ? (
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              showOnlyShowFilteredRecordSwitch={true}
            />
          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {showUnavailbiltyDialog.open && (
        <ManageUnavailability
          onClose={() => setShowUnavailibilityDialog({ open: false, id: null, isClone: false })}
          onSuccess={() => {
            fetchData();
            setShowUnavailibilityDialog({ open: false, id: null, isClone: false });
          }}
          id={showUnavailbiltyDialog.id}
          isClone={showUnavailbiltyDialog.isClone}
          technicianId={id}
        />
      )}
      {showDeleteConfirmBox?.open && (
        <ConfirmationDialog
          open={showDeleteConfirmBox?.open}
          message={`Are you sure you want to delete ${showDeleteConfirmBox?.data ? `${resources?.technicianUnavailability?.titleSingular?.toLowerCase()} : ${showDeleteConfirmBox?.data?.titke}` : 'selected record(s)'} ?`}
          onClose={() => {
            setShowDeleteConfirmBox({ open: false, data: null });
          }}
          okBtnLoading={deleteLoading}
          onOk={() => {
            handleDelete(showDeleteConfirmBox?.data);
          }}
        />
      )}
    </section>
  );
};

export default TechnicianUnavailability;
