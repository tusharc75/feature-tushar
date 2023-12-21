import { Box, Button, IconButton, Menu, MenuItem, } from '@material-ui/core';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile } from 'react-device-detect';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import { camelCase } from 'lodash';
import { useData } from 'src/StateProvider/Provider';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import axiosInstance from 'src/axios/axiosInstance';
import {
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource
} from 'src/constants/helpers';
import { useHistory } from 'react-router-dom';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import styles from '../Leads/Header.module.scss';
import queryString from 'query-string';
import ManageFieldTicket from './ManageFieldTicket';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { deleteOne, findAll, findOne, insertUpdate, objectStore } from 'src/constants/indexdbhelper';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';

const FieldTicket = () => {

  const types = [
    {
      key: `My ${routes.fieldTicket.title}`,
      value: 1
    },
    {
      key: `All ${routes.fieldTicket.title}`,
      value: 2
    }
  ];

  const renderedFrom = camelCase(routes?.fieldTicket.title);

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [fieldTicketId, setFieldTicketId] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false });
  const [anchorEl, setAnchorEl] = useState(null);
  const history = useHistory();
  const { type }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [columns, setColumns] = useState(null);

  const { generateColumns } = useColumns();
  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, isOffline, selectedType]);


  const fetchGridColumns = async () => {
    let data;
    if (isOffline) {
      data = await findOne(objectStore.resource, objectStore.fieldTicket);
    } else {
      const response = await axiosInstance().get(`/field?resource=${sidebarResource?.fieldTicket}`);
      data = response?.data?.data;
      try {
        insertUpdate(objectStore.resource, objectStore.fieldTicket, data);
      } catch (ex) {
        console.error(`Rental Management: Error while storing data for Offline context. Error: ${ex.message}`);
      }
    }
    const newColumns = generateColumns(renderedFrom, data, routes.fieldTicketDetail.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    if (isOffline) {
      const getAllData = await findAll(objectStore.fieldTicket);
      let rows = getAllData?.map((u: any) => {
        let finalObject: any = prepareDataForGrid(u);
        finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
        finalObject['canDelete'] = permissions?.fieldTicket?.isDelete && finalObject?.ownerId === user?.user?._id && u?.canDelete;
        return {
          ...finalObject
        };
      });
      dispatch({ type: 'initialize', data: rows, count: rows?.length || 0 });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } else {
      axiosInstance()
        .get(`${routes?.fieldTicket.path}${queryString}`)
        .then(({ data: { data, count } }) => {
          let rows = data?.map((u: any) => {
            let finalObject: any = prepareDataForGrid(u);
            finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
            finalObject['canDelete'] = permissions?.fieldTicket?.isDelete && finalObject?.ownerId === user?.user?._id && u?.canDelete;
            return {
              ...finalObject
            };
          });
          dispatch({ type: 'initialize', data: rows, count: count });
        })
        .finally(() => {
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
        });
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
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

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
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
        <HtmlTooltip title={permissions?.fieldTicket?.isCreate ? "Clone" : cloneDisable}  >
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.fieldTicket?.isCreate ? false : true}
              onClick={() => {
                setFieldTicketId(row?.original.id);
                setOpen({ open: true, isClone: true });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.fieldTicket?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={row?.original?.canDelete ? "Delete" : deleteDisable}>
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
  }

  const handleDelete = async () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    if (isOffline) {
      for (let i = 0; i < ids.length; i++) {
        deleteOne(objectStore.fieldTicket, ids[i]);
        const data = await findOne(objectStore.offlineDataSync, ids[i]);
        if (data.data.offlineSyncStatus === 'new') {
          deleteOne(objectStore.offlineDataSync, ids[i]);
        } else {
          await insertUpdate(objectStore.offlineDataSync, ids[i], { type: 'fieldTicket', data: { ...data.data, offlineSyncStatus: 'delete' } });
        }
      }
      fetchData();
      setShowDeleteConfirmBox(false);
      setDeleteRecord(null);
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Field Ticket Deleted Successfully in Offline!'
      });
    } else {
      axiosInstance()
        .put(`${routes?.fieldTicket?.path}/remove`, { ids: ids })
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
    }
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
        <CustomBreadCrumbs routes={[{ title: routes.fieldTicket.title }]} />
        <ImportExportLinks
          permissions={permissions.fieldTicket}
          module={routes.fieldTicket.title}
          api={'field-ticket'}
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
      <div className="main-container">
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className={'d-flex flex-wrap align-items-center gap-2'}>
              <div className={`flex flex-wrap items-center gap-2 `}>
                {types && (
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
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox
                onChange={handleSearch}
                className={isMobile ? styles.search_box_input : ''}
                width="242px"
                size="small"
                value={search}
                style={isMobile ? { flex: 1 } : {}}
              />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.fieldTicket.isCreate && (
                  <Button
                    className={`no-shadow`}
                    onClick={() => {
                      setFieldTicketId(null);
                      setOpen({ open: true, isClone: false });
                    }}
                    variant={'contained'}
                    size="small"
                    color="primary"
                    startIcon={<AddOutlined />}
                  >
                    Add
                  </Button>
                )}
                <Button
                  variant={'outlined'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  disabled={selectedRecords.length ? false : true}
                  aria-controls="action-menu"
                  className={`new-dropdown-v1`}
                  endIcon={<ExpandMore />}
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
                    disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
                    onClick={() => {
                      closeActions();
                      setShowDeleteConfirmBox(true);
                    }}
                  >
                    {`Delete (${selectedRecords.length})`}
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
            showFilters={true}
            resource={sidebarResource.fieldTicket}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${routes?.fieldTicket.title?.toLowerCase()}${selectedRecords.length ? "s" : ""} ${deleteRecord?.fieldTicketNumber || ''} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
        {open?.open && (
          <ManageFieldTicket
            id={fieldTicketId}
            isClone={open?.isClone}
            onClose={() => setOpen({ open: false, isClone: false })}
            onSuccess={() => {
              setOpen({ open: false, isClone: false });
              fetchData();
            }}
          />
        )}
      </div>
    </section>
  );
};

export default FieldTicket;
