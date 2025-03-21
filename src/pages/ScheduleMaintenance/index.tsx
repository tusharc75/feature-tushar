import { Add, Delete, Edit, ExpandMore, Construction } from '@mui/icons-material';
import { Autocomplete, Box, IconButton, Menu, MenuItem, TextField } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import { camelCase, uniqBy } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import AssignDynamicDialog from 'src/components/AssignRolesDialog/AssignDynamicDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { displayDate, MATERIAL_TYPE, prepareDataForGrid, product, sidebarResource } from 'src/constants/helpers';
import ManageScheduleMaintenance from 'src/pages/ScheduleMaintenance/ManageScheduleMaintenance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import queryString from 'query-string';
import { useHistory } from 'react-router-dom';
import ScheduleMaintenanceTypeDialog from 'src/pages/ScheduleMaintenance/ScheduleMaintenanceType';
import { FiExternalLink } from 'react-icons/fi';

const ScheduleMaintenance = () => {
  const { setToastConfig } = useContext(CustomToastContext);

  const {
    state: { permissions, resources }
  }: any = useData();

  const history = useHistory();

  const types = [
    {
      key: resources?.product?.titlePlural,
      value: 1
    },
    {
      key: resources?.serializedAsset?.titlePlural,
      value: 2
    }
  ];

  const { type }: any = queryString.parse(history.location.search);

  const [columns, setColumns] = useState(null);
  const [openAssignProductDialog, setOpenAssignProductDialog] = useState(false);
  const [openAssignSerializedAssetDialog, setOpenAssignSerializedAssetDialog] = useState(false);
  const [openCustomDataDialog, setOpenCustomDataDialog] = useState({ open: false, data: null });
  const [rowsToAdd, setRowsToAdd] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [scheduleMaintenanceTypeDialog, setScheduleMaintenanceTypeDialog] = useState(false);
  const [scheduledMaintenanceTypeOptions, setScheduledMaintenanceTypeOptions] = useState([]);
  const [selectedScheduledMaintenanceType, setSelectedScheduledMaintenanceType] = useState(null);

  const renderedFrom = `${camelCase(sidebarResource.schedulingMaintenance)}_${type || 1}`;

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
    setSelectedProduct(null);
    setSelectedScheduledMaintenanceType(null);
  }, [selectedType]);

  useEffect(() => {
    fetchScheduledMaintenanceOptions();
  }, []);

  const fetchScheduledMaintenanceOptions = () => {
    axiosInstance()
      .get(`/scheduled-maintenance-type`)
      .then(({ data: { data } }) => {
        if (data?.length) {
          setScheduledMaintenanceTypeOptions(data?.map((d) => ({ optionLabel: d?.name, optionValue: d?._id })));
        }
      })
      .catch((error) => { });
  };

  const fetchGridColumns = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'initialize', data: [], count: 0 });
    setColumns(null);
    let response = await axiosInstance().get(
      `/field?resource=${selectedType === 1 ? sidebarResource.product : sidebarResource.serializedAsset}&view=true`
    );
    const fields = response?.data?.data?.map((e) => e?.fieldData);

    let coloum: any = [];
    let newColumns;
    if (selectedType === 1) {
      newColumns = generateColumns(
        renderedFrom,
        fields?.filter((e) => ['productName', 'productDescription', 'productNumber']?.includes(e?.fieldName)),
        routes.productDetail.path
      );
    } else {
      newColumns = generateColumns(
        renderedFrom,
        fields?.filter((e) => ['assetNumber', 'product', 'productCategory']?.includes(e?.fieldName)),
        routes.serializedAssetDetail.path
      );
    }

    newColumns?.forEach((o) => {
      if (o?.accessor === 'assetNumber') {
        o.cell = ({ row }) => (
          <div className="flex items-center gap-1">
            <p className="text-truncate" title={row.original.assetNumber}>
              {row.original.assetNumber}
            </p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.serializedAssetDetail.path}/${row.original._id?.split('_')[0]}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        );
      }
      if (o?.accessor === 'productName') {
        o.cell = ({ row }) => (
          <div className="flex items-center gap-1">
            <p className="text-truncate" title={row.original.productName}>
              {row.original.productName}
            </p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.productDetail.path}/${row.original._id?.split('_')[0]}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        );
      }
    });
    coloum = [
      {
        accessor: 'maintenanceType',
        Header: 'Maintenance Type',
        disableFilters: true,
        disableSortBy: true,
        width: 200,
        Cell: ({ row }) => (row.original?.maintenanceType ? <p>{row.original?.maintenanceType}</p> : <NoDataCell />)
      },
      ...newColumns,
      {
        accessor: 'effectiveDate',
        Header: 'Effective Date',
        width: 200,
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => (row.original?.effectiveDate ? <p>{displayDate(row.original?.effectiveDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'duration',
        Header: 'Duration',
        width: 200,
        Cell: ({ row }) => (row.original?.duration ? <p>{row.original?.duration}</p> : <NoDataCell />)
      }
    ];
    coloum.push({
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
          <HtmlTooltip title="Edit">
            <span>
              <IconButton
                size="small"
                onClick={() => {
                  setOpenCustomDataDialog({ open: true, data: row?.original });
                }}
              >
                <Edit fontSize="small" color="primary" />
              </IconButton>
            </span>
          </HtmlTooltip>
          {row?.original?.effectiveDate && row?.original?.duration && (
            <HtmlTooltip title="Delete">
              <span>
                <IconButton
                  size="small"
                  onClick={() => {
                    setShowConfirmBox({ open: true, data: [row.original] });
                  }}
                >
                  <Delete fontSize="small" color="error" />
                </IconButton>
              </span>
            </HtmlTooltip>
          )}
        </>
      )
    });
    setColumns([...coloum, ...getStaticFields()]);
  };

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance().get(`${product.api}/scheduling-maintenance/product`);
      setProducts(uniqBy(response?.data?.data || [], 'optionValue'));
    } catch (e) {
      setToastConfig(e);
    }
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    if (selectedType === 2) {
      fetchProducts();
    }
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly, selectedType, selectedProduct, selectedScheduledMaintenanceType]);

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${product.api}/scheduling-maintenance${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(
        ({
          data: {
            data: { data, count }
          }
        }) => {
          const rows = data.map((e, i) => {
            const finalObject: any = prepareDataForGrid(e);
            finalObject['_id'] = `${e?._id}_${e?.uniqueId ? e?.uniqueId : i}`;
            return finalObject;
          });
          dispatch({ type: 'initialize', data: rows, count: count });
          dispatch({ type: 'loading', loading: false });
        }
      )
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
        setToastConfig(err);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

    if (selectedType === 1) {
      deepFilter = deepFilter + `&materialType=${MATERIAL_TYPE.product}`;
    } else {
      deepFilter = deepFilter + `&materialType=${MATERIAL_TYPE.serializedAsset}`;
    }

    if (selectedScheduledMaintenanceType?.optionValue) {
      deepFilter = deepFilter + `&maintenanceType=${selectedScheduledMaintenanceType.optionValue}`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (selectedProduct?.optionValue) {
      filterByIds.push({
        field: 'product',
        term: selectedProduct?.optionValue
      });
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m?._id.split('_')[0]))}`;
    }

    return deepFilter;
  };

  const handleAdd = async (_data) => {
    let resPonseData;

    const query = `${product.api}/scheduling-maintenance`;

    try {
      setIsSubmitting(true);
      if (rowsToAdd?.length && _data) {
        const response = await axiosInstance().post(query, {
          materials: rowsToAdd?.map((r) => r?._id),
          materialType: MATERIAL_TYPE.product,
          effectiveDate: _data?.effectiveDate,
          duration: _data?.duration,
          maintenanceType: _data?.maintenanceType
        });
        resPonseData = response?.data;
      } else if (_data && selectedType === 1 && (openCustomDataDialog?.data?.uniqueId || selectedRecords?.length)) {
        const response = await axiosInstance().put(query, {
          _id: openCustomDataDialog?.data?.uniqueId ? [openCustomDataDialog?.data?.uniqueId] : selectedRecords?.map((r) => r?.uniqueId),
          effectiveDate: _data?.effectiveDate,
          duration: _data?.duration
        });
        resPonseData = response?.data;
      } else if (_data && selectedType === 2) {
        if (openCustomDataDialog?.data?.uniqueId || selectedRecords?.filter((r) => r?.uniqueId)?.length) {
          const response = await axiosInstance().put(query, {
            _id: openCustomDataDialog?.data?.uniqueId
              ? [openCustomDataDialog?.data?.uniqueId]
              : selectedRecords?.filter((r) => r?.uniqueId)?.map((r) => r?.uniqueId),
            effectiveDate: _data?.effectiveDate,
            duration: _data?.duration
          });
          resPonseData = response?.data;
        }
        if (!openCustomDataDialog?.data?.uniqueId || selectedRecords?.filter((r) => !r?.uniqueId)?.length) {
          const response = await axiosInstance().post(query, {
            materials: openCustomDataDialog?.data?._id
              ? [openCustomDataDialog?.data?._id?.split('_')[0]]
              : selectedRecords?.filter((r) => !r?.uniqueId)?.map((r) => r?._id?.split('_')[0]),
            effectiveDate: _data?.effectiveDate,
            duration: _data?.duration,
            materialType: MATERIAL_TYPE.serializedAsset,
            maintenanceType: _data?.maintenanceType
          });
          resPonseData = response?.data;
        }
      }

      setToastConfig({
        open: true,
        type: 'success',
        message: resPonseData?.message
      });
      fetchData();
      setIsSubmitting(false);
      dispatch({ type: 'selection', selectedRecords: [] });
      setOpenCustomDataDialog({ open: false, data: null });
      setOpenAssignProductDialog(false);
      setOpenAssignSerializedAssetDialog(false);
      setRowsToAdd([]);
    } catch (error) {
      setIsSubmitting(false);
      setToastConfig(error);
    }
  };

  const handleRemove = () => {
    setIsDeleting(true);
    const { data } = showConfirmBox;
    axiosInstance()
      .put(`${product.api}/scheduling-maintenance/remove`, {
        ids: data?.map((d) => d?.uniqueId)
      })
      .then(({ data }) => {
        setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        setIsDeleting(false);
        setShowConfirmBox({ open: false, data: null });
        fetchData();
      })
      .catch((err) => {
        setToastConfig(err);
        setIsDeleting(false);
      });
  };

  const LeftSideContent = () => {
    return (
      <div className="flex gap-2">
        <Autocomplete
          id="maintenanceType"
          fullWidth
          options={scheduledMaintenanceTypeOptions}
          renderInput={(params) => <TextField {...params} size="small" variant="outlined" label="Maintenance Type" margin="none" />}
          getOptionLabel={(option) => option?.optionLabel || ''}
          isOptionEqualToValue={(option: any, val) => (option ? option?.optionValue === val?.optionValue : false)}
          style={{ width: '250px' }}
          onChange={(e, val) => {
            setSelectedScheduledMaintenanceType(val);
          }}
          value={selectedScheduledMaintenanceType}
        />
        {selectedType === 2 && (
          <Autocomplete
            id="products"
            fullWidth
            options={products}
            renderInput={(params) => (
              <TextField {...params} size="small" variant="outlined" label={resources?.product?.titleSingular} margin="none" />
            )}
            getOptionLabel={(option) => option?.optionLabel || ''}
            isOptionEqualToValue={(option: any, val) => (option ? option?.optionValue === val?.optionValue : false)}
            onChange={(e, val) => {
              setSelectedProduct(val);
            }}
            style={{ width: '250px' }}
            value={selectedProduct}
          />
        )}
      </div>
    );
  };

  const LeftSideContentOfSearchFilter = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };
    return (
      <>
        {selectedType === 1 && (
          <>
            <ThemeButton
              id={'add-menu-button'}
              mobileTooltip="Add"
              startIcon={<Add />}
              onClick={handleClick}
              iconForMobile={<Add />}
              endIcon={<ExpandMore fontSize="small" />}
            >
              Add
            </ThemeButton>
            <Menu
              anchorEl={anchorEl}
              keepMounted
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="add-menu"
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem
                onClick={() => {
                  setOpenAssignProductDialog(true);
                  handleClose();
                }}
              >
                {`Add Existing ${resources?.product?.titlePlural}`}
              </MenuItem>
            </Menu>
          </>
        )}
      </>
    );
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.length && selectedRecords?.every((e) => selectedRecords[0]?.maintenanceTypeId === e?.maintenanceTypeId) ? false : true}
          onClick={() => {
            setOpenCustomDataDialog({ open: true, data: { maintenanceTypeId: selectedRecords[0]?.maintenanceTypeId } });
          }}
        >
          Bulk Edit
        </MenuItem>
        <MenuItem
          disabled={selectedRecords.length === 0 || selectedRecords?.some((d: any) => !d?.effectiveDate || !d?.duration)}
          onClick={() => setShowConfirmBox({ open: true, data: selectedRecords })}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: resources?.schedulingMaintenance?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions.product}
          module={sidebarResource.schedulingMaintenance}
          api={`${product.api}/scheduling-maintenance`}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj?._id.split('_')[0])}
          resource={sidebarResource.schedulingMaintenance}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={getQueryString(true)}
          hideDownloadTemplate={selectedType === 2}
        />
        <HtmlTooltip title="Scheduled Maintenance Type">
          <IconButton
            size="small"
            onClick={() => {
              setScheduleMaintenanceTypeDialog(true);
            }}
          >
            <Construction fontSize="small" color="primary" />
          </IconButton>
        </HtmlTooltip>
      </div>
      <CustomContainer>
        <ListingPageHeader
          toggleButtonList={types}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          leftSideContents={<LeftSideContent />}
          leftSideContentsOfSearchFilter={<LeftSideContentOfSearchFilter />}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          isAddButtonVisible={false}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 250px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={false}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {openAssignProductDialog && (
          <AssignDynamicDialog
            resource={sidebarResource.product}
            onSuccess={(rows) => {
              setRowsToAdd(rows);
              setOpenCustomDataDialog({ open: true, data: null });
            }}
            handleClose={() => {
              setOpenAssignProductDialog(false);
            }}
            isSubmitting={isSubmitting}
          />
        )}
        {openAssignSerializedAssetDialog && (
          <AssignDynamicDialog
            resource={sidebarResource.serializedAsset}
            onSuccess={(rows) => {
              setRowsToAdd(rows);
              setOpenCustomDataDialog({ open: true, data: null });
            }}
            handleClose={() => {
              setOpenAssignSerializedAssetDialog(false);
            }}
            isSubmitting={isSubmitting}
          />
        )}
        {openCustomDataDialog.open && (
          <ManageScheduleMaintenance
            data={openCustomDataDialog?.data}
            handleClose={() => {
              setOpenCustomDataDialog({ open: false, data: null });
            }}
            handleSave={(_data) => {
              handleAdd(_data);
            }}
            loading={isSubmitting}
          />
        )}
        {showConfirmBox.open && (
          <ConfirmationDialogRaw
            open={true}
            message={`Are you sure you want to remove selected item(s)?`}
            okBtnLoading={isDeleting}
            onClose={() => {
              setShowConfirmBox({ open: false, data: null });
            }}
            onOk={handleRemove}
          />
        )}
        {scheduleMaintenanceTypeDialog && (
          <ScheduleMaintenanceTypeDialog
            handleClose={() => {
              setScheduleMaintenanceTypeDialog(false);
            }}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default ScheduleMaintenance;
