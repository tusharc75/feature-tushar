import { Autocomplete, Box, IconButton, MenuItem, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { ASSET_STATUS, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import axios, { CancelTokenSource } from 'axios';
import ManageSerializedPackages from 'src/pages/SerializedPackages/ManageSerializedPackages';
import { deleteDisable } from 'src/constants/messageHelpers';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';

const SerializedPackages = ({ resourceRendered = '' }) => {
  const toastConfig = useContext(CustomToastContext);

  const renderedFrom =
    resourceRendered === sidebarResource.serializedPackagesInspection
      ? camelCase(sidebarResource?.serializedPackagesInspection)
      : camelCase(sidebarResource?.serializedPackages);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSerializedPackageDialog, setShowSerializedPackageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [columns, setColumns] = useState(null);
  const [lookupResourceOptions, setLookupResourceOptions] = useState(null);
  const [selectedLookupResource, setSelectedLookupResource] = useState({
    [sidebarResource.warehouse]: null,
    [sidebarResource.packages]: null
  });
  const [showConfirmBoxDisassembled, setShowConfirmBoxDisassembled] = useState(false);

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.warehouse},${sidebarResource.packages}`)
      .then(({ data: { data } }) => {
        if (data) {
          setLookupResourceOptions(data);
        }
      });
  }, []);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [search, page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly, selectedLookupResource]);

  const fetchGridColumns = async () => {
    const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource.serializedPackages, permissions?.serializedPackages?.isUpdate);
    let newColumns = generateColumns(
      renderedFrom,
      fieldsDataForRead,
      resourceRendered === sidebarResource.serializedPackagesInspection
        ? routes.serializedPackagesInspectionDetail.path
        : routes.serializedPackagesDetail.path,
      true
    );
    setColumns([...newColumns, ...getStaticFields(true), ActionsRenderer]);
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
        {permissions?.serializedPackages?.isCreate ? (
          <HtmlTooltip title="Clone">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowSerializedPackageDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
        ) : (
          <HtmlTooltip className="cursor-stop" title="You do not have permission to clone/create">
            <IconButton aria-label="Clone" size="small">
              <FileCopyIcon fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        )}
        <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    let { filterByIds, deepFilters } = gridFilterParser(filters);
    if (selectedLookupResource[sidebarResource.warehouse]) {
      filterByIds = filterByIds?.filter((f) => f?.field != 'warehouse');
      filterByIds.push({ field: 'warehouse', term: { $in: [selectedLookupResource[sidebarResource.warehouse]?.optionValue] } });
    }
    if (selectedLookupResource[sidebarResource.packages]) {
      filterByIds = filterByIds?.filter((f) => f?.field != 'package');
      filterByIds.push({ field: 'package', term: { $in: [selectedLookupResource[sidebarResource.packages]?.optionValue] } });
    }
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || [])?.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes.serializedPackages.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        let count = data?.count;
        let rows = data?.data?.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['isChecked'] = false;
          finalObject['allowedToEdit'] = permissions?.serializedPackages?.isUpdate;
          finalObject['canDelete'] = permissions?.serializedPackages?.isDelete && u?.canDelete;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleDelete = () => {
    setIsSubmitting(true);
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${routes.serializedPackages.path}/remove`, { ids: ids })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const handleDisassemble = () => {
    setIsSubmitting(true);
    const ids = selectedRecords?.map((d) => d._id);
    axiosInstance()
      .put(`${routes.serializedPackages?.path}/disassemble`, { ids: ids })
      .then(({ data }: any) => {
        fetchData();
        setIsSubmitting(false);
        setShowConfirmBoxDisassembled(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const ActionMenuItems = () => {
    return (
      <>
        {resourceRendered === sidebarResource.serializedPackagesInspection ? (
          permissions?.serializedPackages?.isUpdate && (
            <MenuItem
              key={'serialized-package-disassemble'}
              onClick={() => {
                setShowConfirmBoxDisassembled(true);
              }}
              disabled={selectedRecords?.some((e) => e?.status !== ASSET_STATUS.available)}
            >
              Disassemble
            </MenuItem>
          )
        ) : (
          <MenuItem
            disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
            onClick={() => {
              if (selectedRecords.length === 1) {
                setDeleteRecord(selectedRecords[0]);
              } else {
                setDeleteRecord(null);
              }
              setShowDeleteConfirmBox(true);
            }}
          >
            {`Delete (${selectedRecords?.length})`}
          </MenuItem>
        )}
      </>
    );
  };

  const leftSideContents = () => {
    return (
      <div className="w-100 flex items-center gap-2">
        <Autocomplete
          fullWidth
          className="max-w-[300px]"
          options={
            lookupResourceOptions && lookupResourceOptions[sidebarResource.warehouse]?.length > 0
              ? lookupResourceOptions[sidebarResource.warehouse]
              : []
          }
          getOptionLabel={(option: any) => (option ? option?.optionLabel || '' : '')}
          value={selectedLookupResource[sidebarResource.warehouse]}
          onChange={(e, val) => {
            setSelectedLookupResource((prev) => ({ ...prev, [sidebarResource.warehouse]: val }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              margin="dense"
              size="small"
              name="warehouse"
              placeholder={`${resources?.warehouse?.titleSingular}`}
              label={`${resources?.warehouse?.titleSingular}`}
              variant="outlined"
              fullWidth
            />
          )}
        />
        <Autocomplete
          fullWidth
          className="max-w-[300px]"
          options={
            lookupResourceOptions && lookupResourceOptions[sidebarResource.packages]?.length > 0
              ? lookupResourceOptions[sidebarResource.packages]
              : []
          }
          getOptionLabel={(option: any) => (option ? option?.optionLabel || '' : '')}
          value={selectedLookupResource[sidebarResource.packages]}
          onChange={(e, val) => {
            setSelectedLookupResource((prev) => ({ ...prev, [sidebarResource.packages]: val }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              margin="dense"
              size="small"
              name="package"
              placeholder={`${resources?.packages?.titleSingular}`}
              label={`${resources?.packages?.titleSingular}`}
              variant="outlined"
              fullWidth
            />
          )}
        />
      </div>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs
          routes={[
            resourceRendered === sidebarResource.serializedPackagesInspection
              ? { ...routes.serializedPackagesInspection, title: resources?.serializedPackagesInspection?.titlePlural }
              : { ...routes.serializedPackages, title: resources?.serializedPackages?.titlePlural }
          ]}
        />
        {resourceRendered != sidebarResource.serializedPackagesInspection && (
          <ImportExportLinks
            permissions={permissions?.serializedPackages}
            module={resources?.serializedPackages?.titlePlural}
            api={routes.serializedPackages.path}
            afterImportCompleted={() => {
              fetchData();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords?.length}
            ids={selectedRecords?.map((obj) => obj._id)}
            onExportToExcelSuccess={() => {
              fetchData();
            }}
            additionalParams={getQueryString(true)}
          />
        )}
      </div>
      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          isAddButtonVisible={resourceRendered !== sidebarResource.serializedPackagesInspection}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => {
            setShowSerializedPackageDialog({ open: true, isClone: false, idToClone: null });
          }}
          leftSideContents={leftSideContents()}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.serializedPackages}
            hideAction={resourceRendered === sidebarResource.serializedPackagesInspection}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${deleteRecord ? `${resources?.serializedPackages?.titleSingular?.toLowerCase()} : ${deleteRecord?.serializedPackageNumber || ''}` : `selected ${resources?.serializedPackages?.titlePlural?.toLowerCase()}`} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={handleDelete}
        />
      )}
      {showSerializedPackageDialog.open && (
        <ManageSerializedPackages
          isClone={showSerializedPackageDialog.isClone}
          id={showSerializedPackageDialog.idToClone}
          onClose={() => setShowSerializedPackageDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            fetchData();
            setShowSerializedPackageDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
      {showConfirmBoxDisassembled && (
        <ConfirmationDialog
          open={showConfirmBoxDisassembled}
          message={`Are you sure you want to disassemble selected ${resources?.serializedPackages?.titlePlural?.toLowerCase()} ?`}
          onClose={() => setShowConfirmBoxDisassembled(false)}
          onOk={handleDisassemble}
          okBtnLoading={isSubmitting}
        />
      )}
    </section>
  );
};

export default SerializedPackages;
