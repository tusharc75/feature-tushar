import { useState, FC, useReducer, useEffect, useContext, Fragment } from 'react';
import { Box, Button, Chip, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import { useData } from '../../StateProvider/Provider';
import CreateProjectSales from './CreateProjectSales';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { customerAccount, gridLoadingTimeout, supplierAccount } from '../../constants/helpers';
import './style.scss';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import EntitySelectionsDialog from '../../components/EntitySelections';
import { AiOutlineDeploymentUnit } from 'react-icons/ai';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { sidebarResource, prepareDataForGrid } from '../../constants/helpers';
import { useHistory } from 'react-router-dom';
import { camelCase } from 'lodash';
import { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns } from 'src/components/CustomReactTableNew';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cloneDisable, deleteDisable, entityDisable } from 'src/constants/messageHelpers';
import DeleteIcon from '@material-ui/icons/Delete';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import SearchBox from 'src/components/Helpers/SearchBox';
import { isMobile } from 'react-device-detect';
import styles from '../Leads/Header.module.scss';
import { AddOutlined, ExpandMore } from '@material-ui/icons';



const ProjectSales: FC = () => {

  const types = [
    {
      key: `My ${routes.projectSales.title}`,
      value: 1
    },
    {
      key: `All ${routes.projectSales.title}`,
      value: 2
    }
  ];


  const renderedFrom = camelCase(routes?.projectSales.title);

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();
  const [isOpen, setIsOpen] = useState({ open: false, isClone: false, idToClone: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedType, setselectedType] = useState(1);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState({ show: false, isDelete: false });
  const [projectSalesId, setProjectSalesId] = useState(null);
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [entities, setEntities] = useState([]);
  const [columns, setColumns] = useState(null);

  const [referenceDetails, setReferenceDetails] = useState({
    referenceId: history.location?.state?.accountId,
    referenceName: history.location?.state?.accountName,
    resource: history.location?.state?.resource
  });

  const [state, dispatch] = useReducer(reducer, intialState);
  const [anchorEl, setAnchorEl] = useState(null);

  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } =
    state;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.projectSales}`)
      .then(({ data: { data } }) => {
        let columns = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.projectSalesDetail.path, true);

          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
          }
        });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns, ActionsRenderer]);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 150,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.projectSales?.isCreate ? "Clone" : cloneDisable}>
          <span>
            <IconButton
              disabled={permissions?.projectSales?.isCreate ? false : true}
              size="small"
              aria-label="Clone"
              onClick={() => {
                setIsOpen({ open: true, isClone: true, idToClone: row?.original?._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.projectSales?.isCreate ? 'primary' : 'disabled'} />
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
                setShowDeleteConfirmBox(true);
                setDeleteRecord(row);
                // showConfirmBox(row?.original);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={(permissions?.projectSales?.isUpdate && row?.original?.isTeamMember) || row?.original?.isManager ? "Entity" : entityDisable}>
          <span>
            <IconButton
              disabled={(permissions?.projectSales?.isUpdate && row?.original?.isTeamMember) || row?.original?.isManager ? false : true}
              size="small"
              aria-label="Entity"
              onClick={() => {
                setProjectSalesId(row?.original._id);
                setShowEntityDialog(true);
                if (row?.original?.entity) {
                  let entities = [];
                  if (row?.original?.entityId) {
                    entities.push(row?.original?.entityId);
                  }
                  if (row?.original?.restentity) {
                    let restEntities = row?.original?.restentity.map((o) => o.optionValue);
                    entities = [...entities, ...restEntities];
                  }
                  setEntities([...entities]);
                }
              }}
            >
              <AiOutlineDeploymentUnit fontSize="15" color={(permissions?.projectSales?.isUpdate && row?.original?.isTeamMember) || row?.original?.isManager ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, selectedEntity, selectedType, showFilteredRecordsOnly]);

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (isExport) {
      deepFilter = `?`;
    }

    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (referenceDetails.referenceId) {
      if (referenceDetails.resource === sidebarResource.opportunity) {
        filterByIds.push({ field: 'staticData.opportunity', term: referenceDetails.referenceId });
      } else if (referenceDetails.resource === customerAccount.accountResource) {
        filterByIds.push({ field: 'customerAccountName', term: referenceDetails.referenceId });
      } else if (referenceDetails.resource === supplierAccount.accountResource) {
        filterByIds.push({ field: 'supplierAccountName', term: { $in: [referenceDetails.referenceId] } });
      }
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

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`/project-sales${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((project) => {
          let finalObject = prepareDataForGrid(project, user);
          finalObject['canDelete'] = finalObject['projectManagerId'] === user?.user._id;
          return {
            ...finalObject,
            isManager: user.user._id === project?.projectManager?.optionValue,
            isTeamMember: Boolean(data.staticData?.user.find((u) => u._id === user.user._id))
          };
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        dispatch({ type: 'loading', loading: false });
      });

  };

  const handleProjectFilter = (filterValues) => {
    dispatch({ type: 'setPage', page: 0 });
    setselectedType(filterValues);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    let ids = [];
    if (deleteRecord?._id) {
      ids.push(deleteRecord?._id);
    } else {
      selectedRecords.forEach((obj) => {
        ids.push(obj._id);
      });
    }

    axiosInstance()
      .put(`/project-sales/remove`, { ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowDeleteConfirmBox(false);
        setDeleteLoading(false);
        setDeleteRecord(null);
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowDeleteConfirmBox(false);
        setDeleteLoading(false);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleCreate = () => {
    setIsOpen({ open: true, isClone: false, idToClone: null });
  };

  const handleClose = () => {
    setIsOpen({ open: false, isClone: false, idToClone: null });
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      handleProjectFilter(types.find((d) => d.key === newFilter).value);
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
        <CustomBreadCrumbs routes={[routes.projectSales]} />
        <ImportExportLinks
          permissions={permissions?.projectSales}
          module="project-sale(s)"
          api={'project-sales'}
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
                    className="ml-2"
                    value={types[selectedType - 1].key}
                    exclusive
                    onChange={handleFilter}
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
                {permissions?.projectSales?.isCreate && (
                  <Button
                    onClick={() => {
                      setIsOpen({ open: true, isClone: false, idToClone: null });
                    }}
                    variant={'contained'}
                    size="small"
                    color="primary"
                    className={`no-shadow`}
                    startIcon={<AddOutlined />}
                  >
                    Add
                  </Button>
                )}
                <HtmlTooltip title="Please select some project sales">
                  <span>
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
                  </span>
                </HtmlTooltip>
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
                  {permissions?.projectSales?.isUpdate && (
                    <MenuItem
                      disabled={selectedRecords.length === 0}
                      onClick={() => {
                        if (selectedRecords.some((d) => d.isUpdate === false)) {
                          closeActions();
                          setShowDeleteWarningConfirmBox({ show: true, isDelete: false });
                        } else {
                          closeActions();
                          if (selectedRecords.length) {
                            let entities = [];
                            selectedRecords.map((current) => {
                              if (current?.entity) {
                                if (current?.entityId) {
                                  entities.push(current?.entityId);
                                }
                                if (current?.restentity) {
                                  let restEntities = current?.restentity.map((o) => o.optionValue);
                                  entities = [...entities, ...restEntities];
                                }
                              }
                            });
                            setEntities([...entities]);
                          }
                          setShowEntityDialog(true);
                        }
                      }}
                    >
                      Assign Entity &nbsp; <Chip size="small" label={selectedRecords.length} />
                    </MenuItem>
                  )}
                </Menu>
              </div>
            </div>
          </div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            onSelect={() => { }}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={false}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.projectSales}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>

      {showDeleteWarningConfirmBox?.show ? (
        <MessageDialog
          open={showDeleteWarningConfirmBox?.show}
          message={
            showDeleteWarningConfirmBox?.isDelete
              ? `You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`
              : `You are trying to update records which you do not have permission to update, Please remove those records from selection and try again.`
          }
          onClose={() => setShowDeleteWarningConfirmBox({ show: false, isDelete: false })}
        />
      ) : null}

      {showDeleteConfirmBox ? (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${routes?.projectSales?.title?.toLowerCase()}${selectedRecords.length ? "s" : ""} ${deleteRecord?._id ? deleteRecord?.projectName : ''
            } ? `}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={deleteLoading}
          onOk={handleDelete}
        />
      ) : null}
      {showEntityDialog ? (
        <EntitySelectionsDialog
          open={showEntityDialog}
          resource={sidebarResource.projectSales}
          resourceIds={selectedRecords.length ? selectedRecords.map((o) => o._id) : [projectSalesId]}
          onClose={() => {
            setShowEntityDialog(false);
            setProjectSalesId('');
          }}
          entities={entities}
          onSuccess={fetchData}
        />
      ) : null}
      {isOpen?.open && (
        <CreateProjectSales
          open={isOpen?.open}
          isClone={isOpen?.isClone}
          projectSalesId={isOpen?.idToClone}
          close={handleClose}
          fetchData={fetchData}
        />
      )}
    </section>
  );
};

export default ProjectSales;
