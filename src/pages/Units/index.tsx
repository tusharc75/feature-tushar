import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@material-ui/icons/Delete';
import WarningIcon from '@material-ui/icons/Warning';
import { camelCase } from 'lodash';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import WarningFilter from 'src/components/WarningFilter';
import { COLOUR_MASTER, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { deleteDisable } from 'src/constants/messageHelpers';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ManageUnit from './ManageUnit';
import axios, { CancelTokenSource } from 'axios';

const getWarningList = (row?: any) => {
  const icon = <WarningIcon style={{ fontSize: '16px' }} fontSize="small" color="error" />;
  const list = [
    {
      warningFilter: 1,
      icon,
      title: 'Unit is assigned to multiple deals',
      label: 'Unit is assigned to multiple deals',
      isVisible: row?.original?.restdeal?.length > 0
    },
    {
      warningFilter: 2,
      icon,
      label: 'Manager Plus Status Conflict',
      title: 'Manager Plus Status Conflict - Status is other than Active,Committed',
      isVisible: row?.original?.secondaryStatus === 'Allocated' && !['ACTIVE', 'COMMITTED']?.includes(row?.original?.status)
    },
    {
      warningFilter: 3,
      icon,
      title: 'Unit is not ready for the deal',
      label: 'Unit is not ready for the deal',
      isVisible:
        row?.original?.availabilityDate &&
        row?.original?.contractDate &&
        new Date(row?.original?.availabilityDate)?.getTime() > new Date(row?.original?.contractDate)?.getTime()
    }
  ];

  return list;
};

const Units = () => {
  const renderedFrom = camelCase(sidebarResource?.units);
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { permissions, selectedEntity, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [open, setOpen] = useState({ open: false, id: null });
  const [columns, setColumns] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const { generateColumns } = useColumns();
  const [checkedFilter, setCheckedFilter] = useState<null | number>(null);

  useEffect(() => {
    fetchColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);

    return () => cancelTokenSource.cancel();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, checkedFilter]);

  const getWarnings = useCallback((row: any) => {
    const warningList = getWarningList(row).filter((d) => d.isVisible);
    return warningList;
  }, []);

  const fetchColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.units}`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(renderedFrom, data, routes.unitDetail.path, true);
        newColumns?.forEach((o) => {
          if (o?.accessor === 'unitNumber') {
            o.cell = ({ row }) => {
              const warnings = getWarnings(row);
              return (
                <div
                  style={{
                    backgroundColor: warnings.length > 0 ? COLOUR_MASTER.lostAssets.background : ''
                  }}
                >
                  <Link className="link text-truncate" title={row?.original?.unitNumber} to={`${routes.unitDetail.path}/${row?.original?._id}`}>
                    {row?.original?.unitNumber}
                  </Link>
                  {warnings?.length > 0
                    ? warnings.map((w) => (
                        <Box ml={1} key={w.warningFilter}>
                          <HtmlTooltip title={w.title} placement="top" arrow>
                            {w.icon}
                          </HtmlTooltip>
                        </Box>
                      ))
                    : null}
                </div>
              );
            };
          }
        });
        setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
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

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${routes?.units.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u: any) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['canDelete'] = permissions?.units?.isDelete;
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const values: any = { _id: updatedData?._id };
    Object.keys(inputField)?.map((_key) => {
      values[_key] = updatedData[_key] ? updatedData[_key] : '';
    });
    axiosInstance()
      .put(`/dynamic-form/update-selected-field`, values, {
        headers: {
          Resource: sidebarResource.units
        }
      })
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

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    if (checkedFilter) {
      deepFilter = `${deepFilter}&warningFilter=${checkedFilter}`;
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || [])?.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleDelete = async () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }

    axiosInstance()
      .put(`${routes?.units?.path}/remove`, { ids: ids })
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const ActionMenuItems = () => {
    return (
      <>
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
          {`Delete (${selectedRecords.length})`}
        </MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: resources?.units?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions.units}
          module={resources?.units?.titlePlural}
          api={'units'}
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
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          rightSideContents={<WarningFilter checkedFilter={checkedFilter} setCheckedFilter={setCheckedFilter} warnings={getWarningList()} />}
          addButtonOnclick={() => {
            setOpen({ open: true, id: null });
          }}
          isAddButtonVisible={permissions?.units?.isCreate}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            onSaveEdit={onSaveInlineEdit}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.units}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {open?.open && (
          <ManageUnit
            id={open?.id}
            onClose={() => {
              setOpen({ open: false, id: null });
            }}
            onSuccess={() => {
              fetchData();
              setOpen({ open: false, id: null });
            }}
          />
        )}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${
              deleteRecord
                ? `${resources?.units?.titleSingular?.toLowerCase()} :
              ${deleteRecord?.unitNumber || ''}`
                : `selected ${resources?.units?.titlePlural?.toLowerCase()}`
            } ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default Units;
