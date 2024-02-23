import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import SearchBox from 'src/components/Helpers/SearchBox';
import { deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { gridLoadingTimeout, prepareDataForGrid } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageSupportTicket from './ManageSupportTicket';

let searchTimeout;

const SupportTicket = () => {
  const renderedFrom = camelCase(routes?.supportTicket.title);
  const toastConfig = useContext(CustomToastContext);

  const types = [
    {
      key: `My ${routes.supportTicket.title}`,
      value: 1
    },
    {
      key: `All ${routes.supportTicket.title}`,
      value: 2
    }
  ];

  const history = useHistory();
  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, selectedEntity }
  }: any = useData();

  const [selectedType, setSelectedType] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [renderCount, setRenderCount] = useState(0);

  const [columns, setColumns] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

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
    axiosInstance()
      .get(`${routes.supportTicket.path}/fields?brand=${user?.user?.brand}`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(renderedFrom, data?.filter((field) => field?.fieldData?.sectionName !== 'Internal Information'), routes.supportTicketDetail.path, true);
        newColumns?.forEach((o) => {
          if (o?.accessor === 'supportTicketNumber') {
            o.cell = ({ row }) =>
              row?.original?.supportTicketNumber ? (
                <div>
                  <Link
                    className="link text-truncate"
                    title={row?.original?.supportTicketNumber}
                    to={`${routes.supportTicketDetail.path}/${row?.original?._id}`}
                    target={'_self'}
                    rel="noopener noreferrer"
                  >
                    {row?.original?.supportTicketNumber}
                  </Link>
                </div>
              ) : (
                <NoDataCell />
              );
          }
        });
        setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
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
        <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={!row?.original?.canDelete}
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
    let deepFilter = `?page=${page}&limit=${limit}&brand=${user?.user?.brand}`;
    if (isExport) {
      deepFilter = `?`;
    }
    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
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

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes.supportTicket.path}${queryString}`)
      .then(({ data: { data } }) => {
        let count = data?.count;
        let rows = data?.data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['canDelete'] = finalObject?.ownerId === user?.user?._id && finalObject?.status === 'Pending';
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
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
      .put(`${routes.supportTicket.path}/remove`, { ids: ids })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
    const value = types.find((d) => d.key === type).value;
    setSelectedType(value);
    history.push(`?type=${value}`);
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.supportTicket]} />
        <ImportExportLinks
          permissions={{ isCreate: true, isUpdate: true, isRead: true }}
          module={routes.supportTicket.title}
          api={routes.supportTicket.path}
          afterImportCompleted={() => { }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={`${getQueryString(true)}&ignoreInternalFields=${true}`}
          onlyExport={true}
        />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'flex justify-between align-items-center gap-1 w-full'}>
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
            </div>
            <div className="flex flex-wrap gap-[8px] justify-end">
              <SearchBox onChange={handleSearch} value={search} />
              <div className="flex gap-[8px] flex-wrap items-center">
                <Button
                  variant={'contained'}
                  color="primary"
                  size="small"
                  className={`no-shadow`}
                  onClick={() => {
                    setShowManageDialog({ open: true, isClone: false, idToClone: null });
                  }}
                  startIcon={<AddOutlined />}
                >
                  Add
                </Button>
                <Button
                  variant={'outlined'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  className={`new-dropdown-v1`}
                  aria-controls="action-menu"
                  endIcon={<ExpandMore />}
                  disabled={selectedRecords.length === 0 || selectedRecords?.some((e) => !e.canDelete) ? true : false}
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
                  <MenuItem
                    onClick={() => {
                      closeActions();
                      if (selectedRecords.length === 1) {
                        setDeleteRecord(selectedRecords[0]);
                      }
                      setShowDeleteConfirmBox(true);
                    }}
                  >
                    {`Delete (${selectedRecords?.length})`}
                  </MenuItem>
                </Menu>
              </div>
            </div>
          </div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
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
          message={`Are you sure you want to delete ${routes?.supportTicket?.title} ${deleteRecord?.supportTicketNumber || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={handleDelete}
        />
      )}
      {showManageDialog.open && (
        <ManageSupportTicket
          isClone={showManageDialog.isClone}
          id={showManageDialog.idToClone}
          onClose={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            fetchData();
            setShowManageDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </section>
  );
};

export default SupportTicket;
