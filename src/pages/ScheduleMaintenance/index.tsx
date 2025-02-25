import { Add, Delete, Edit, ExpandMore } from '@mui/icons-material';
import { Box, IconButton, Menu, MenuItem } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
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

const ScheduleMaintenance = () => {
  const renderedFrom = camelCase(sidebarResource.scheduleMaintenance);
  const { setToastConfig } = useContext(CustomToastContext);

  const {
    state: { permissions, resources }
  }: any = useData();

  const types = [
    {
      key: `Products`,
      value: 1
    },
    {
      key: `Serialized Assets`,
      value: 2
    }
  ];

  const [columns, setColumns] = useState(null);
  const [openAssignProductDialog, setOpenAssignProductDialog] = useState(false);
  const [openAssignSerializedAssetDialog, setOpenAssignSerializedAssetDialog] = useState(false);
  const [openCustomDataDialog, setOpenCustomDataDialog] = useState({ open: false, data: null });
  const [rowsToAdd, setRowsToAdd] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedType, setSelectedType] = useState(1);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, dataRows, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, [selectedType]);

  const fetchGridColumns = async () => {
    let response;
    if(selectedType===1){
      response = await axiosInstance().get(`/field?resource=${sidebarResource.product}&view=true`);
    }
    else{
      response = await axiosInstance().get(`/field?resource=${sidebarResource.serializedAsset}&view=true`);
    }
    const fields = response?.data?.data?.map((e) => e?.fieldData);

    let coloum: any = [];

    let newColumns;
    if(selectedType===1){
      fields
        ?.filter((e) => ['productName']?.includes(e.fieldName))
        ?.forEach((ele) => {
          if (ele?.fieldName === 'productName') {
            coloum.push({
              accessor: 'productName',
              Header: ele?.fieldLabel,
              width: 200,
              Cell: ({ row }) => (
                <div className="flex items-center gap-2">
                  <p className="text-truncate">{row.original.productName}</p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.productDetail.path}/${row?.original?.productId}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              )
            });
          }
        });
        newColumns = generateColumns(
          renderedFrom,
          fields?.filter((e) => ['productDescription', 'productNumber']?.includes(e?.fieldName))
        );
    }
    else{
      fields
        ?.filter((e) => ['assetNumber']?.includes(e.fieldName))
        ?.forEach((ele) => {
          if (ele?.fieldName === 'assetNumber') {
            coloum.push({
              accessor: 'assetNumber',
              Header: ele?.fieldLabel,
              width: 200,
              Cell: ({ row }) => (
                <div className="flex items-center gap-2">
                  <p className="text-truncate">{row.original.assetNumber}</p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.serializedAssetDetail.path}/${row?.original?.assetId}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              )
            });
          }
        });
        newColumns = generateColumns(
          renderedFrom,
          fields?.filter((e) => ['productDescription','productCategory']?.includes(e?.fieldName))
        );
        newColumns.push({
          accessor: 'productNumber',
          Header: 'Product Number',
          width: 200,
          disableFilters: true,
          disableSortBy: true,
          Cell: ({ row }) => (row.original?.product?.productNumber ? <p>{displayDate(row.original?.product?.productNumber)}</p> : <NoDataCell />)
        })
    }

    coloum = [
      ...coloum,
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
        </>
      )
    });
    setColumns([...coloum, ...getStaticFields()]);
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly, selectedType]);

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
          let rows = data.map((u, index) => {
            let res: any = {
              ...prepareDataForGrid(u)
            };
            res.productName = u?.productDetail?.optionLabel || '';
            res.productId = u?.productDetail?.optionValue || '';
            res.productDescription = u?.productDetail?.productDescription || '';
            res.productNumber = u?.productDetail?.productNumber || '';

            res.assetNumber = u?.serializedAssetDetail?.assetNumber || '';
            res.assetId = u?.serializedAssetDetail?._id || '';
            res.productDescription = u?.serializedAssetDetail?.product?.productDescription || '';
            res.productCategory = u?.serializedAssetDetail?.productCategory.optionLabel || '';
            return res;
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
      deepFilter = deepFilter + `&type=product`;
    }
    else{
      deepFilter = deepFilter + `&type=serializedAsset`;
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
          type: selectedType === 1? MATERIAL_TYPE.product : MATERIAL_TYPE.serializedAsset,
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
    } else if (_data && openCustomDataDialog?.data?._id) {
      setIsSubmitting(true);
      axiosInstance()
        .put(`${product.api}/scheduledMaintenance`, {
          _id: openCustomDataDialog?.data?._id,
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
    }
  };

  const handleRemove = () => {
    setIsDeleting(true);
    const { data } = showConfirmBox;
    axiosInstance()
      .put(`${product.api}/scheduledMaintenance/remove`, {
        ids: data?.map((d) => d?._id)
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
        <ThemeButton
          id={'add-menu-button'}
          mobileTooltip="Add"
          startIcon={isMobile ? null : <Add />}
          onClick={handleClick}
          aria-controls="add-menu"
          mode="light"
          iconForMobile={<Add />}
          endIcon={isMobile ? null : <ExpandMore fontSize="small" />}
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
          <MenuItem
            onClick={() => {
              setOpenAssignSerializedAssetDialog(true);
              handleClose();
            }}
          >
            {`Add Existing ${resources?.serializedAsset?.titlePlural}`}
          </MenuItem>
        </Menu>
      </>
    );
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem disabled={selectedRecords.length === 0} onClick={() => setShowConfirmBox({ open: true, data: selectedRecords })}>
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
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          toggleButtonList={types}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          leftSideContents={<LeftSideContent />}
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
          <AssignProductDialog
            handleCloseDialog={() => setOpenAssignProductDialog(false)}
            onSuccess={(rows) => {
              setRowsToAdd(rows);
              setOpenCustomDataDialog({ open: true, data: null });
            }}
            serialized={true}
            isSubmitting={false}
            ids={dataRows?.map((d) => d?.materialId)}
            hideQty={true}
          />
        )}
        {openAssignSerializedAssetDialog && (
          <AssignSerializedAssetDialog
            handleClose={() => setOpenAssignSerializedAssetDialog(false)}
            handleSucess={(rows) => {
              setRowsToAdd(rows);
              setOpenCustomDataDialog({ open: true, data: null });
            }}
            isAssigning={false}
            ids={dataRows?.map((d) => d?.materialId)}
            reference={null}
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
            message={`Are you sure you want to delete this product(s)?`}
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
