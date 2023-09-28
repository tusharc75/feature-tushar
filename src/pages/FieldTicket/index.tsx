import { Box, Button, Grid, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import React, { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import { camelCase } from 'lodash';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import { useData } from 'src/StateProvider/Provider';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { MdAdd, MdOutlineFilterAlt } from 'react-icons/md';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import axiosInstance from 'src/axios/axiosInstance';
import {
  getLocalStorageArrayData,
  gridLoadingTimeout,
  isObjectEmpty,
  prepareDataForGrid,
  removeLocalStorage,
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
import MobileFilterDialog, { DisplayFiltersForMobile } from 'src/components/MobileFilterDialog';
import MobileSortDialog from 'src/components/MobileSortDialog';
import { TbArrowsSort } from 'react-icons/tb';

const FieldTicket = () => {
  const FieldTicketType = [
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
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [fieldTicketId, setFieldTicketId] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false });
  const [anchorEl, setAnchorEl] = useState(null);
  const history = useHistory();
  const { type }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const { getColumnData } = useColumns();
  const { isOffline } = useContext(CustomOfflineContext);

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
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.fieldTicketDetail.path, true);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
          rendererNames.push(currentColumn?.rendererName);
        }
      }
    });
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      ...tempFrameworkComponent,
      actionsRenderer: ActionsRenderer
    };
    setFrameWorkComponent({ ...tempFrameworkComponent });
    columns = [...columns, ...getStaticFields()];
    setColumns([...columns]);
  };

  const fetchFieldTicketData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    if (gridApi) {
      gridApi.setRowData([]);
    }
    if (isOffline) {
      const getAllData = await findAll(objectStore.fieldTicket);
      let rows = getAllData?.map((u: any) => {
        let finalObject: any = prepareDataForGrid(u);
        finalObject['canDelete'] = permissions?.fieldTicket?.isDelete && finalObject?.ownerId === user?.user?._id;
        finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
        finalObject['allowedToEdit'] = permissions?.fieldTicket?.isUpdate;
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
            const ownerAndColaborators = [u?.owner, ...u?.collaborator]?.map((o) => o?.optionValue);
            let finalObject: any = prepareDataForGrid(u);
            finalObject['canDelete'] = permissions?.fieldTicket?.isDelete && ownerAndColaborators.includes(user?.user?._id) && u?.canDelete;
            finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
            finalObject['allowedToEdit'] = permissions?.fieldTicket?.isUpdate;
            return {
              ...finalObject
            };
          });
          if (appendRows) {
            dispatch({
              type: 'initialize',
              data: [...dataRows, ...rows],
              count: count
              // selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
            });
          } else {
            dispatch({
              type: 'initialize',
              data: rows,
              count: count
              // selectedRecords: rows.filter((f) => f.isChecked === true)
            });
          }
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
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
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

  const ActionsRenderer = (params) => (
    <Fragment>
      {permissions?.fieldTicket?.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setFieldTicketId(params.data.id);
              setOpen({ open: true, isClone: true });
            }}
          >
            <FileCopyIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to clone/create">
          <IconButton aria-label="Clone" size="small">
            <FileCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {params?.data?.canDelete ? (
        <Tooltip title="Delete">
          <IconButton
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(params.data);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to delete">
          <IconButton aria-label="Delete">
            <DeleteIcon fontSize="small" color="disabled" />
          </IconButton>
        </Tooltip>
      )}
    </Fragment>
  );

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
      removeLocalStorage(localStorageSelectedRecords);
      fetchFieldTicketData();
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
          removeLocalStorage(localStorageSelectedRecords);
          fetchFieldTicketData();
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
    dispatch({ type: 'setPage', page: 0 });
    const value = FieldTicketType.find((d) => d.key === type).value;
    setSelectedType(value);
    history.push(`?type=${value}`);
  };

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchFieldTicketData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, isOffline, selectedType]);

  const [filter, setFilter] = useState(FieldTicketType[0].key);

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      onTypeChange(event, newFilter);
    }
  };
  let toggleInner = FieldTicketType && (
    <ToggleButtonGroup size="small" className=" toggle-button-layout" value={filter} exclusive onChange={handleFilter}>
      {FieldTicketType.map((k, index) => {
        return (
          <ToggleButton value={k.key} key={index}>
            {k.key}
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );

  const [isOpenDialog, setisOpenDialog] = useState(false);
  const [openSort, setOpenSort] = useState(false);

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClose = () => {
    setisOpenDialog(false);
  };

  const handleClickOpen = () => {
    setOpenSort(true);
  };

  const handleClickClose = () => {
    setOpenSort(false);
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.fieldTicket.title }]} />
        <ImportExportLinks
          permissions={permissions.fieldTicket}
          module="fieldTicket"
          api={'field-ticket'}
          afterImportCompleted={() => {
            fetchFieldTicketData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length}
          ids={
            getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
              ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id)
              : []
          }
          onExportToExcelSuccess={() => {
            if (gridApi) gridApi.deselectAll();
            else fetchFieldTicketData();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'flex justify-between align-items-center gap-1 w-full'}>
              {/* {toggleInner} */}
              <ToggleButtonGroup
                size="small"
                className="align-items-center gap-1 "
                value={FieldTicketType[selectedType - 1].key}
                exclusive
                onChange={onTypeChange}
              >
                {FieldTicketType.map((k, index) => {
                  return (
                    <ToggleButton value={k.key} key={index}>
                      {k.key}
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
              {isMobile && !isTablet && (
                <div className="flex flex-wrap items-center gap-1 justify-end">
                  <IconButton
                    size="small"
                    className={'mobileIconButton secondary'}
                    onClick={handleClickOpen}
                    id="demo-customized-button"
                    aria-controls="demo-customized-menu"
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    style={isTablet ? { marginLeft: '50px' } : {}}
                  >
                    <TbArrowsSort className="rotate-90" size={16} />
                  </IconButton>

                  <MobileSortDialog
                    isOpen={openSort}
                    handleClose={handleClickClose}
                    contentPart={''}
                    secHeading={['Sort Repair Job']}
                    columns={columns}
                    dispatch={dispatch}
                  />

                  <IconButton
                    size="small"
                    onClick={handleOpen}
                    id="demo-customized-button"
                    aria-controls="demo-customized-menu"
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    className={'mobileIconButton secondary'}
                  >
                    <MdOutlineFilterAlt size={16} />
                  </IconButton>
                  <MobileFilterDialog
                    isOpen={isOpenDialog}
                    handleClose={handleClose}
                    contentPart={''}
                    columns={columns}
                    dispatch={dispatch}
                    title={routes?.repairJob?.title}
                    filters={filters}
                    resource={sidebarResource.fieldTicket}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox onChange={handleSearch} className={styles.search_box_input} size="small" value={search} />
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
                {permissions?.fieldTicket?.isDelete && (
                  <>
                    <Button
                      variant={'outlined'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      disabled={selectedRecords.length ? false : true}
                      aria-controls="action-menu"
                      className={` new-dropdown-v1`}
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
                        disabled={
                          !(
                            (selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) === selectedRecords?.length
                          )
                        }
                        onClick={() => {
                          closeActions();
                          // eslint-disable-next-line no-lone-blocks
                          {
                            selectedRecords.length === 1 && setDeleteRecord(selectedRecords[0]);
                          }
                          setShowDeleteConfirmBox(true);
                        }}
                      >
                        Delete
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </div>
            </div>
            <DisplayFiltersForMobile resource={sidebarResource.fieldTicket} />
          </div>
        </div>
        {Object.keys(frameWorkComponent).length > 0 ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions.fieldTicket}
              primaryField={columns?.find((d) => d.primaryField)}
              onClick={(data) => {
                history.push(`${routes.fieldTicketDetail.path}/${data.id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {
                setFieldTicketId(data.id);
                setOpen({ open: true, isClone: false });
              }}
              extraParamsToCheckDelete={true}
              onDelete={(data) => {
                setDeleteRecord(data);
                setShowDeleteConfirmBox(true);
              }}
              rowCount={rowCount}
              page={page}
              loading={loading}
              additionalDetails={[]}
              owerCollaboratorInitialsOrImages=""
              onCreate={false}
              showClone={true}
              onClone={(data) => {
                setFieldTicketId(data.id);
                setOpen({ open: true, isClone: true });
              }}
              chips={[]}
              renderedFrom={renderedFrom}
            />
          ) : (
            <CustomAgGrid
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameWorkComponent}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              allowAction={true}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchFieldTicketData}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.fieldTicket}
            />
          )
        ) : null}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete Field Ticket  ${deleteRecord?.fieldTicketNumber || ''} ?`}
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
              fetchFieldTicketData();
            }}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default FieldTicket;
