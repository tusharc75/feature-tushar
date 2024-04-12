import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, CancelOutlined, CheckCircleOutlined, ExpandMore } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { flash, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageFlash from './ManageFlash';
import { ListingPageHeader } from 'src/components/PageHeaders';
import axios, { CancelTokenSource } from 'axios';

const Flash = () => {
  const renderedFrom = camelCase(routes?.flash.title);
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [statusChangeRecord, setStatusChangeRecord] = useState(null);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState({
    open: false,
    value: null
  });
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cencelToken = axios.CancelToken.source();
    fetchData(cencelToken);
    return () => cencelToken.cancel();
  }, [search, page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.flash}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes.flashDetail.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

  const handleUpdateStatus = (value: string) => {
    let prepareData = [];
    if (statusChangeRecord) {
      prepareData.push({
        id: statusChangeRecord.id,
        status: statusChangeRecord.value
      });
    } else {
      prepareData = selectedRecords?.map((d) => ({
        id: d._id,
        status: value
      }));
    }
    axiosInstance()
      .put(`${flash.api}/updateStatus`, prepareData)
      .then(() => {
        fetchData();
        setShowStatusChangeDialog({
          open: false,
          value: null
        });
        setStatusChangeRecord(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 140,
    width: 140,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        {permissions?.flash?.isUpdate && row?.original?.status === 'Pending' && (
          <>
            <HtmlTooltip title="Approve">
              <IconButton
                size="small"
                aria-label="Approve"
                onClick={() => {
                  setStatusChangeRecord({ id: row?.original?._id, value: 'Approved' });
                  setShowStatusChangeDialog({ open: true, value: 'Approved' });
                }}
              >
                <CheckCircleOutlined color="secondary" />
              </IconButton>
            </HtmlTooltip>
            <HtmlTooltip title="Deny">
              <IconButton
                size="small"
                aria-label="Deny"
                onClick={() => {
                  setStatusChangeRecord({ id: row?.original?._id, value: 'Deny' });
                  setShowStatusChangeDialog({ open: true, value: 'Deny' });
                }}
              >
                <CancelOutlined color="error" />
              </IconButton>
            </HtmlTooltip>
          </>
        )}
        {permissions?.flash?.isDelete && row?.original?.status === 'Pending' && (
          <HtmlTooltip title="Delete">
            <IconButton
              size="small"
              aria-label="Delete"
              onClick={() => {
                setDeleteRecord(row?.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon color="error" />
            </IconButton>
          </HtmlTooltip>
        )}
      </>
    )
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
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

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${flash.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.flash?.isUpdate;
          finalObject['canDelete'] = permissions?.flash?.isDelete;
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
      .put(`${flash.api}/remove`, { ids: ids })
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

  const ActionMenuItems = () => {
    return (
      <>
        {permissions?.flash?.isUpdate && (
          <>
            <MenuItem
              disabled={
                !(
                  (selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.allowedToEdit === true)?.length) === selectedRecords?.length &&
                  selectedRecords?.filter((e) => e?.status === 'Pending')?.length === selectedRecords?.length
                )
              }
              onClick={(e) => {
                setShowStatusChangeDialog({ open: true, value: 'Approved' });
              }}
            >
              Approve
            </MenuItem>
            <MenuItem
              disabled={
                !(
                  (selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) === selectedRecords?.length &&
                  selectedRecords?.filter((e) => e?.status === 'Pending')?.length === selectedRecords?.length
                )
              }
              onClick={(e) => {
                setShowStatusChangeDialog({ open: true, value: 'Deny' });
              }}
            >
              Deny
            </MenuItem>
          </>
        )}
        {permissions?.flash?.isDelete && (
          <MenuItem
            disabled={
              !(
                (selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) === selectedRecords?.length &&
                selectedRecords?.filter((e) => e?.status === 'Pending')?.length === selectedRecords?.length
              )
            }
            onClick={() => {
              if (selectedRecords.length === 1) setDeleteRecord(selectedRecords[0]);
              setShowDeleteConfirmBox(true);
            }}
          >
            Delete
          </MenuItem>
        )}
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.flash]} />
        <ImportExportLinks
          permissions={permissions?.flash}
          module={routes.flash.title}
          api={flash.api}
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
      </div>
      <CustomContainer>
        <ListingPageHeader
          // toggleButtonList
          // onToggle
          // selectedType
          // setSelectedType
          // leftSideContents
          searchValue={search}
          onSearch={handleSearch}
          // rightSideContents
          isActionButtonVisible={permissions?.flash?.isDelete}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          // addButtonProps
          addButtonOnclick={() => {
            setShowManageDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={permissions?.flash?.isDelete}
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
            resource={sidebarResource.flash}
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
          message={`Are you sure you want to delete ${routes?.flash?.title} ${deleteRecord?.demandOrderNumber || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={handleDelete}
        />
      )}
      {showManageDialog.open && (
        <ManageFlash
          isClone={showManageDialog.isClone}
          flashId={showManageDialog.idToClone}
          onClose={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            fetchData();
            setShowManageDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
      {showStatusChangeDialog.open && (
        <ConfirmationDialog
          open={showStatusChangeDialog.open}
          message={`Are you sure you want to change the staus of selected records to ${showStatusChangeDialog?.value}? `}
          onClose={() => {
            setStatusChangeRecord(null);
            setShowStatusChangeDialog({ open: false, value: null });
          }}
          onOk={() => handleUpdateStatus(showStatusChangeDialog?.value)}
        />
      )}
    </section>
  );
};

export default Flash;
