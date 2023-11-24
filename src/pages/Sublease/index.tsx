import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource, sublease } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { Button, Chip, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import ManageSublease from './ManageSublease';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

let searchTimeout;

const Sublease = () => {
  let renderedFrom = camelCase(routes.sublease?.title);
  const toastConfig = useContext(CustomToastContext);

  const types = [
    {
      key: `My ${routes.sublease.title}`,
      value: 1
    },
    {
      key: `All ${routes.sublease.title}`,
      value: 2
    }
  ];

  const history = useHistory();
  let { type, referenceId, referenceType }: any = queryString.parse(history.location.search);
  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { getColumnData } = useColumns();

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchData();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Sublease`);
    data = response?.data?.data;
    let columns = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.subleaseDetail.path, true);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
      }
      return o?.fieldData;
    });
    columns = [...columns, ...getStaticFields(), ActionsRenderer];
    setColumns(columns);
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
        {permissions?.sublease?.isCreate ? (
          <HtmlTooltip title="Clone">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageDialog({ open: true, isClone: true, idToClone: row.original._id });
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
      </>
    )
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);
    if (referenceId) {
      filterByIds.push({ field: 'rentalJob', term: referenceId });
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${sublease.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['isSelected'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['canDelete'] = false;
          finalObject['allowedToEdit'] = [...(u.collaborator ?? []), u.owner].some((d) => d?.optionValue === user?.user?._id);
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

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    axiosInstance()
      .put(`${sublease.api}/remove`, { ids: ids })
      .then(() => {
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const updateQueryParams = () => {
    const queryParams = new URLSearchParams(history.location.search);
    queryParams.delete('referenceId');
    queryParams.delete('referenceType');
    referenceId = queryParams.get('referenceId');
    referenceType = queryParams.get('referenceType');
    history.replace({
      search: queryParams.toString()
    });
    fetchData();
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
    const value = types.find((d) => d.key === type).value;
    setSelectedType(value);
    if (referenceId && referenceType) {
      history.push(`?type=${value}&referenceType=${referenceType}&referenceId=${referenceId}`);
    } else {
      history.push(`?type=${value}`);
    }
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.sublease]} />
        <ImportExportLinks
          permissions={permissions?.sublease}
          module={routes.sublease.title}
          api={sublease.api}
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
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'flex justify-between align-items-center gap-1 w-full'}>
              <div>
                <ToggleButtonGroup
                  size="small"
                  className="align-items-center gap-1 "
                  value={types[selectedType - 1].key}
                  exclusive
                  onChange={onTypeChange}
                >
                  {types.map((k, index) => {
                    return (
                      <ToggleButton value={k.key} key={index}>
                        {k.key}
                      </ToggleButton>
                    );
                  })}
                </ToggleButtonGroup>
                {referenceType && <Chip className="ml-3" color="primary" label={`Rental Job : ${referenceType}`} onDelete={updateQueryParams} />}
              </div>
            </div>
            <div className="flex flex-wrap gap-[8px] justify-end">
              <SearchBox onChange={handleSearch} className={styles.search_box_input} value={search} size="small" />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.sublease?.isCreate && (
                  <Button
                    onClick={() => {
                      setShowManageDialog({ open: true, isClone: false, idToClone: null });
                    }}
                    variant={'contained'}
                    size="small"
                    color="primary"
                    className={'no-shadow'}
                    startIcon={<AddOutlined />}
                  >
                    Add
                  </Button>
                )}
                {permissions?.demandOrder?.isDelete && (
                  <>
                    <Button
                      variant={'outlined'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      className={`new-dropdown-v1`}
                      aria-controls="action-menu"
                      endIcon={<ExpandMore />}
                      disabled={selectedRecords?.length ? false : true}
                    >
                      Actions
                    </Button>
                    <Menu
                      anchorEl={anchorEl}
                      keepMounted
                      getContentAnchorEl={null}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                      }}
                      id="action-menu"
                      open={Boolean(anchorEl)}
                      onClose={closeActions}
                    >
                      {permissions?.sublease?.isDelete && (
                        <MenuItem
                          onClick={() => {
                            closeActions();
                            setShowDeleteConfirmBox(true);
                          }}
                        >
                          {`Delete (${selectedRecords?.length})`}
                        </MenuItem>
                      )}
                    </Menu>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            onSelect={() => {}}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={false}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.sublease}
          />
        ) : null}
      </CustomContainer>
      {showManageDialog.open && (
        <ManageSublease
          isClone={showManageDialog.isClone}
          subleaseId={showManageDialog.idToClone}
          onClose={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            setShowManageDialog({ open: false, isClone: false, idToClone: null });
            fetchData();
          }}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${routes.sublease?.title} ? `}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </section>
  );
};

export default Sublease;
