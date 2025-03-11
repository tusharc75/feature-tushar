import { Add, Delete, Edit, ExpandMore } from '@mui/icons-material';
import { Autocomplete, Box, IconButton, Menu, MenuItem, TextField } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
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
  const [selectedType, setSelectedType] = useState(type || 1);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const renderedFrom = `${camelCase(sidebarResource.scheduleMaintenance)}_${selectedType}`;

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
    setSelectedProduct(null);
  }, [selectedType]);

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
    coloum = [
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
      const response = await axiosInstance().get(`${product.api}/scheduledMaintenance/product`);
      setProducts(response?.data?.data || []);
    } catch (e) {
      setToastConfig(e);
    }
  }

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    if (selectedType === 2) {
      fetchProducts();
    }
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly, selectedType, selectedProduct]);

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${product.api}/scheduledMaintenance${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(
        ({
          data: {
            data: { data, count }
          }
        }) => {
          const rows = data.map((e) => prepareDataForGrid(e));
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

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (selectedProduct?.optionValue) {
      filterByIds.push({
        field: 'product',
        term: selectedProduct?.optionValue
      })
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }

    return deepFilter;
  };

  const handleAdd = (_data) => {
    if (rowsToAdd?.length && _data) {
      setIsSubmitting(true);
      axiosInstance()
        .post(`${product.api}/scheduledMaintenance`, {
          materials: rowsToAdd?.map((r) => r?._id),
          materialType: MATERIAL_TYPE.product,
          effectiveDate: _data?.effectiveDate,
          duration: _data?.duration
        })
        .then(({ data }) => {
          fetchData();
          setIsSubmitting(false);
          setOpenCustomDataDialog({ open: false, data: null });
          setOpenAssignProductDialog(false);
          setOpenAssignSerializedAssetDialog(false);
          setRowsToAdd([]);
        })
        .catch((error) => {
          setIsSubmitting(false);
          setToastConfig(error);
        });
    } else if (_data && openCustomDataDialog?.data?.uniqueId) {
      setIsSubmitting(true);
      axiosInstance()
        .put(`${product.api}/scheduledMaintenance`, {
          _id: openCustomDataDialog?.data?.uniqueId,
          effectiveDate: _data?.effectiveDate,
          duration: _data?.duration
        })
        .then(({ data }) => {
          fetchData();
          setIsSubmitting(false);
          setOpenCustomDataDialog({ open: false, data: null });
          setOpenAssignProductDialog(false);
          setOpenAssignSerializedAssetDialog(false);
        })
        .catch((error) => {
          setIsSubmitting(false);
          setToastConfig(error);
        });
    } else if (_data && !openCustomDataDialog?.data?.uniqueId) {
      setIsSubmitting(true);
      axiosInstance()
        .post(`${product.api}/scheduledMaintenance`, {
          materials: [openCustomDataDialog?.data?._id],
          effectiveDate: _data?.effectiveDate,
          duration: _data?.duration,
          materialType: MATERIAL_TYPE.serializedAsset
        })
        .then(({ data }) => {
          fetchData();
          setIsSubmitting(false);
          setOpenCustomDataDialog({ open: false, data: null });
          setOpenAssignProductDialog(false);
          setOpenAssignSerializedAssetDialog(false);
        })
        .catch((error) => {
          setIsSubmitting(false);
          setToastConfig(error);
        });
    }
  };

  const handleRemove = () => {
    setIsDeleting(true);
    const { data } = showConfirmBox;
    axiosInstance()
      .put(`${product.api}/scheduledMaintenance/remove`, {
        ids: data?.map((d) => d?.uniqueId)
      })
      .then(() => {
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
    const [anchorEl, setAnchorEl] = useState(null);
    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };
    return (
      <>
        {selectedType === 2 && (
          <Autocomplete
            id="products"
            fullWidth
            options={products}
            renderInput={(params) => <TextField {...params} size="small" variant="outlined" label="Select Product" margin="none" />}
            getOptionLabel={(option) => option?.optionLabel || ''}
            isOptionEqualToValue={(option: any, val) => (option ? option?.optionValue === val?.optionValue : false)}
            onChange={(e, val) => {
              setSelectedProduct(val);
            }}
            value={selectedProduct}
          />
        )}
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
        <CustomBreadCrumbs routes={[{ title: 'Schedule Maintenances' }]} />
        <ImportExportLinks
          permissions={permissions.product}
          module={sidebarResource.scheduleMaintenance}
          api={`${product.api}/scheduledMaintenance`}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          resource={sidebarResource.scheduleMaintenance}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={getQueryString(true)}
          hideDownloadTemplate={selectedType === 2}
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          toggleButtonList={types}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          leftSideContentsOfSearchFilter={<LeftSideContent />}
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
            fromResource={sidebarResource.scheduleMaintenance}
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
            fromResource={sidebarResource.scheduleMaintenance}
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
      </CustomContainer>
    </section>
  );
};

export default ScheduleMaintenance;
