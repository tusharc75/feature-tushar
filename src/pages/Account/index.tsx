import { Button, Chip, IconButton, Menu, MenuItem, MenuList, Box } from '@material-ui/core';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CancelIcon from '@material-ui/icons/Cancel';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { camelCase } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { AiOutlineDeploymentUnit } from 'react-icons/ai';
import queryString from 'query-string';
import { FcApproval } from 'react-icons/fc';
import { HiBadgeCheck } from 'react-icons/hi';
import { Link, useHistory } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import axiosInstance from '../../axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import CustomContainer from '../../components/CustomContainer';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import EntitySelectionsDialog from '../../components/EntitySelections';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import NoDataCell from '../../components/Helpers/NoDataCell';
import SearchBox from '../../components/Helpers/SearchBox';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import styles from '../Leads/Header.module.scss';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageAccountDialog from './ManageAccount/index';
import WarhouseList from './Warehouse/WarhouseList';
import accountClass from './account.module.scss';
import { cloneDisable } from 'src/constants/messageHelpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';



const options = ['All', 'Approved', 'Disapproved'];

export default function Account(props) {

  const types = [
    {
      key: 'My Accounts',
      value: 1
    },
    {
      key: 'All Accounts',
      value: 2
    }
  ];

  const toastConfig = useContext(CustomToastContext);
  const { getColumnData } = useColumns();
  const {
    account: { accountApi, accountResource, accountRoute }
  } = props;
  const {
    state: { user, permissions, selectedEntity },
    dispatch: entityDispatch
  }: any = useData();

  const renderedFrom = camelCase(accountResource);
  const history = useHistory();
  let { type }: any = queryString.parse(history.location.search);

  const [cloneId, setCloneId] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuType, setMenuType] = useState(options[0]);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState({ show: false, isDelete: false });
  const [isAccDialogVisible, setIsAccDialogVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [accountId, setAccountId] = useState(null);
  const [openAddPlantsDialog, setOpenAddPlantsDialog] = React.useState(false);
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [isAddingWarehouse, setAddingWarehouse] = useState(false);
  const [singleAccountDelete, setSingleAccountDelete] = useState({
    id: null,
    show: false,
    accountName: ''
  });
  const [singleApproveDisapproveAccount, setSingleApproveDisapproveAccount] = useState<any>({
    show: false,
    approved: false,
    id: null,
    accountName: ''
  });
  const [multipleApproveDisapproveAccount, setMultipleApproveDisapproveAccount] = useState<any>({ show: false, approved: false, selectedRecords: 0 });

  const [accountPermissions, setAccountPermissions] = useState({
    isCreate: permissions[accountResource]?.isCreate,
    isRead: permissions[accountResource]?.isRead,
    isUpdate: permissions[accountResource]?.isUpdate,
    isDelete: permissions[accountResource]?.isDelete,
    approveAccount: false
  });

  const [open, setOpen] = React.useState(false);
  const [entities, setEntities] = useState([]);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [accountNameForClone, setAccountNameForClone] = useState('');
  const [columns, setColumns] = useState(null);

  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource[accountResource]}`);
    data = response?.data?.data;
    let columns = [];

    data.forEach((o) => {
      if (['accountName'].indexOf(o?.fieldData?.fieldName) === 0) {
        columns = [
          ...columns,
          {
            accessor: 'accountName',
            Header: 'Account Name',
            minWidth: 150,
            width: 150,
            Cell: ({ row }) => {
              return (
                <span className="d-flex gap-2 align-items-center">
                  <Link className="link" to={`/${accountRoute}/detail/${row?.original?._id}`}>
                    {row?.original?.accountName}
                  </Link>
                  {row?.original?.approved && <FcApproval title="Approved" size={20} />}
                </span>
              );
            }
          }
        ];
      } else {
        let currentColumn = getColumnData(accountResource, o?.fieldData, `/${accountRoute}/detail`, true);
        if (currentColumn !== null) {
          columns = [...columns, currentColumn?.columnData];
        }
      }
      return o?.fieldData;
    });
    if (accountResource.includes('customer')) {
      columns = [
        ...columns,
        {
          accessor: 'relatedLead',
          Header: 'Related Lead',
          minWidth: 150,
          width: 150,
          Cell: ({ row }) =>
            row?.original?.lead ? (
              row?.original?.leadEntity === selectedEntity ? (
                <Link className="link" to={`${routes.leadDetail.path}/${row?.original?.leadId}`} title={row?.original?.lead}>
                  {row?.original?.lead}
                </Link>
              ) : hasAccessToEntity(row?.original?.leadEntity) ? (
                <span
                  className="link"
                  onClick={() => {
                    handleEntityChange(row?.original?.leadEntity);
                    history.replace(`${routes.leadDetail.path}/${row?.original?.leadId}`);
                  }}
                  title={row?.original?.lead}
                >
                  {row?.original?.lead}
                </span>
              ) : (
                <span title={row?.original?.lead}>
                  <CustomRenderCell value={row?.original?.lead} />
                </span>
              )
            ) : (
              <NoDataCell />
            )
        }
      ];
    }
    columns = [...columns, ...getStaticFields(), ActionsRenderer];
    setColumns(columns);
  };

  useEffect(() => {
    if (permissions) {
      setAccountPermissions(permissions[accountResource]);
    }
  }, [permissions]);

  useEffect(() => {
    fetchAccounts();
  }, [page, limit, selectedType, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, menuType]);

  const handleEntityChange = (entityId) => {
    entityDispatch({ type: SET_SELECTED_ENTITY, payload: entityId });
  };

  const hasAccessToEntity = (id) => {
    const entityList = user.entity?.map((entity) => entity._id);
    return entityList.includes(id);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 150,
    width: 150,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={accountPermissions.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={accountPermissions.isCreate ? false : true}
              onClick={() => {
                cloneAccount(row?.original);
              }}
            >
              <FileCopyIcon fontSize="small" color={accountPermissions.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        {accountPermissions?.isUpdate && accountPermissions?.approveAccount && row?.original?.approved ? (
          <HtmlTooltip title="Disapprove">
            <span>
              <IconButton
                size="small"
                aria-label="Disapprove"
                onClick={() => {
                  setSingleApproveDisapproveAccount({
                    show: true,
                    approved: false,
                    id: row?.original?._id,
                    accountName: row?.original?.accountName
                  });
                }}
              >
                <CancelIcon fontSize="small" color="error" />
              </IconButton>
            </span>
          </HtmlTooltip>
        ) : (
          <HtmlTooltip title={row?.original?.approved ? 'Disapprove' : 'Approve'}>
            <span>
              <IconButton
                size="small"
                aria-label={row?.original?.approved ? 'Disapprove' : 'Approve'}
                onClick={() => {
                  setSingleApproveDisapproveAccount({
                    show: true,
                    approved: row?.original?.approved ? false : true,
                    id: row?.original?._id,
                    accountName: row?.original?.accountName
                  });
                }}
              >
                {row?.original?.approved ? <HiBadgeCheck /> : <FcApproval />}
              </IconButton>
            </span>
          </HtmlTooltip>
        )}
        <GridDeleteIcon
          hasDeletePermission={accountPermissions?.isDelete}
          ownerId={row?.original?.ownerId}
          userId={user?.user?._id}
          onDelete={() => {
            setSingleAccountDelete({
              show: true,
              id: row?.original?._id,
              accountName: row?.original?.accountName
            });
          }}
          entity="account"
        />
        <HtmlTooltip title={accountPermissions?.isUpdate && row?.original?.isAllowedToUpdate ? 'Entity' : 'You do not have permission to update entity'}  >
          <span>
            <IconButton
              size="small"
              aria-label="Entity"
              disabled={accountPermissions?.isUpdate && row?.original?.isAllowedToUpdate ? false : true}
              onClick={() => {
                setAccountId(row?.original?._id);
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
              <AiOutlineDeploymentUnit
                fontSize="15"
                color={accountPermissions?.isUpdate && row?.original?.isAllowedToUpdate ? 'primary' : 'disabled'}
              />
            </IconButton>
          </span>
        </HtmlTooltip>
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

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (menuType !== options[0]) {
      deepFilters.push({ field: 'staticData.approved', term: type === 'Approved' });
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

  const menuOptionSelection = (selectedOption) => {
    setMenuType(options[selectedOption]);
  };

  const handleMenuItemClick = (event: React.MouseEvent<HTMLLIElement, MouseEvent>, index: number) => {
    setSelectedIndex(index);
    menuOptionSelection(index);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: React.MouseEvent<Document, MouseEvent>) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }

    setOpen(false);
  };

  const fetchAccounts = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${accountApi}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          let res = {
            ...finalObject,
            canDelete: u.owner?.optionValue === user?.user._id,
            allowedToEdit: [...(u.collaborator ?? []), u.owner].some((d) => d?.optionValue == user?.user?._id),
            lead: u.staticData && u.staticData.lead && u.staticData.lead.concatedName,
            leadId: u.staticData && u.staticData.lead && u.staticData.lead._id,
            leadEntity: u.staticData && u.staticData.lead && u.staticData.lead?.entity,
            approved: u.staticData?.approved ? u.staticData?.approved : false,
            isChecked: false,
            masterAccount: u.parentHierarchy.length > 0 ? u.parentHierarchy.find((d) => d.parentAccount === '')?.accountName : '',
            masterAccountId: u.parentHierarchy.length > 0 ? u.parentHierarchy.find((d) => d.parentAccount === '')?._id : ''
          };
          return res;
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

  const cloneAccount = async (data) => {
    setAccountNameForClone(data?.accountName);
    setCloneId(data?._id);
    setIsAccDialogVisible(true);
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  // ****** ACTIONS BUTTON STUFF *********
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const clickCreateNew = () => {
    setIsAccDialogVisible(true);
  };

  const handleDeleteAccounts = async () => {
    let selectedAccounts = selectedRecords?.map((cr) => cr._id);
    if (selectedAccounts.length > 0) {
      axiosInstance()
        .put(`/${accountApi}/remove`, {
          ids: [...selectedAccounts]
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setShowDeleteConfirmBox(false);
          dispatch({ type: 'selection', selectedRecords: [] });
          fetchAccounts();
        })
        .catch((error) => {
          setShowDeleteConfirmBox(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleSingleDeleteAccounts = async () => {
    axiosInstance()
      .put(`/${accountApi}/remove`, { ids: [singleAccountDelete.id] })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchAccounts();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setShowDeleteConfirmBox(false);
      });
    setSingleAccountDelete({ id: null, show: false, accountName: '' });
  };

  const handleSingleApproveDisapproveAccount = () => {
    axiosInstance()
      .post(`/${accountApi}/approve`, {
        ids: [singleApproveDisapproveAccount.id],
        approved: singleApproveDisapproveAccount.approved
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setSingleApproveDisapproveAccount({
          show: false,
          approved: false,
          id: null,
          accountName: ''
        });
        fetchAccounts();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSingleApproveDisapproveAccount({
          show: false,
          approved: false,
          id: null,
          accountName: ''
        });
      });
  };

  const handleDialogClose = (params) => {
    if (params && params.fetch) {
      fetchAccounts();
    }
    setIsAccDialogVisible(false);
    if (cloneId) {
      setCloneId('');
    }
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
    const value = types.find((d) => d.key === type).value;
    setSelectedType(value);
    history.push(`?type=${value}`);
  };

  const approveDisapproveAccounts = () => {
    const selectedAccountIds = selectedRecords?.filter((d) => d.approved === !multipleApproveDisapproveAccount.approved).map((m) => m._id);
    axiosInstance()
      .post(`/${accountApi}/approve`, {
        ids: selectedAccountIds,
        approved: multipleApproveDisapproveAccount.approved
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setMultipleApproveDisapproveAccount({
          show: false,
          approved: false,
          selectedRecords: 0
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchAccounts();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setMultipleApproveDisapproveAccount({
          show: false,
          approved: false,
          selectedRecords: 0
        });
      });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes[accountResource].title }]} />
        <ImportExportLinks
          permissions={accountPermissions}
          module="account(s)"
          api={accountApi}
          afterImportCompleted={() => {
            fetchAccounts();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchAccounts();
          }}
          additionalParams={getQueryString(true)}
          extraImportExportLinks={[
            ...(accountResource === 'supplierAccount' && user?.user?.brandPolicy?.serializedAssetCertification
              ? [
                {
                  title: 'Supplier View Template',
                  api: `${accountApi}/items/unknown/template`,
                  type: 'download'
                },
                {
                  title: 'Supplier View Export',
                  api: `${accountApi}/items/unknown/template?export=true${selectedRecords?.length ? `&ids=${JSON.stringify(selectedRecords?.map((obj) => obj._id))}` : ''
                    }`,
                  type: 'export'
                },
                {
                  title: 'Supplier View Import',
                  api: `${accountApi}/items/unknown/import`,
                  type: 'import'
                }
              ]
              : [])
          ]}
        />
      </div>
      <CustomContainer>
        <div className={`${accountClass['account_header_inner_container']}`}>
          <div className="header-panel">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={'flex justify-between align-items-center gap-1 w-full'}>
                <div>
                  <ToggleButtonGroup
                    size="small"
                    className="align-items-center gap-1"
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
                  <ButtonGroup
                    id="approveDisapprove"
                    size="small"
                    className={'accountActions'}
                    variant="outlined"
                    color="primary"
                    ref={anchorRef}
                    aria-label="small outlined button group"
                  >
                    <Button style={{ marginLeft: '10px' }}>{options[selectedIndex]}</Button>
                    <Button
                      color="primary"
                      size="small"
                      aria-controls={open ? 'split-button-menu' : undefined}
                      aria-expanded={open ? 'true' : undefined}
                      aria-label="select merge strategy"
                      aria-haspopup="menu"
                      onClick={handleToggle}
                      className="all-button"
                    >
                      <ArrowDropDownIcon className="all-button-sub-icon" />
                    </Button>
                  </ButtonGroup>
                  <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal style={{ zIndex: 1111111 }}>
                    {({ TransitionProps, placement }) => (
                      <Grow
                        {...TransitionProps}
                        style={{
                          transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom'
                        }}
                      >
                        <Paper>
                          <ClickAwayListener onClickAway={handleClose}>
                            <MenuList id="menu" style={{ backgroundColor: 'transparent', fontSize: '10px' }}>
                              {options.map((option, index) => (
                                <MenuItem key={option} selected={index === selectedIndex} onClick={(event) => handleMenuItemClick(event, index)}>
                                  {option}
                                </MenuItem>
                              ))}
                            </MenuList>
                          </ClickAwayListener>
                        </Paper>
                      </Grow>
                    )}
                  </Popper>
                </div>
              </div>
              <div className="flex flex-wrap gap-[8px]  justify-end">
                <SearchBox onChange={handleSearch} className={styles.search_box_input} value={search} size="small" />
                <div className="flex gap-[8px] flex-wrap items-center">
                  <Button
                    disabled={!accountPermissions.isCreate}
                    variant={'contained'}
                    color="primary"
                    size="small"
                    className={`no-shadow`}
                    onClick={clickCreateNew}
                    startIcon={<AddOutlined />}
                  >
                    Add
                  </Button>
                  <Button
                    disabled={selectedRecords?.length === 0}
                    variant={'outlined'}
                    color="default"
                    size="small"
                    className={`new-dropdown-v1`}
                    onClick={openActions}
                    aria-controls="action-menu"
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
                    {accountPermissions?.isUpdate && accountPermissions?.approveAccount && (
                      <MenuItem
                        disabled={selectedRecords?.filter((d) => !d.approved).length === 0}
                        onClick={() => {
                          closeActions();
                          setMultipleApproveDisapproveAccount({
                            show: true,
                            approved: true,
                            selectedRecords: selectedRecords?.filter((d) => !d.approved).length
                          });
                        }}
                      >
                        Approve Accounts &nbsp; <Chip size="small" label={selectedRecords?.filter((d) => !d.approved).length} />
                      </MenuItem>
                    )}
                    {accountPermissions?.isUpdate && accountPermissions?.approveAccount && (
                      <MenuItem
                        disabled={selectedRecords?.filter((d) => d.approved).length === 0}
                        onClick={() => {
                          closeActions();
                          setMultipleApproveDisapproveAccount({
                            show: true,
                            approved: false,
                            selectedRecords: selectedRecords?.filter((d) => d.approved).length
                          });
                        }}
                      >
                        Disapprove Accounts &nbsp; <Chip size="small" label={selectedRecords?.filter((d) => d.approved).length} />
                      </MenuItem>
                    )}
                    {accountPermissions?.isDelete && (
                      <MenuItem
                        disabled={selectedRecords?.length === 0}
                        onClick={() => {
                          if (selectedRecords?.some((d) => d.canDelete === false)) {
                            closeActions();
                            setShowDeleteWarningConfirmBox({ show: true, isDelete: true });
                          } else {
                            closeActions();
                            setShowDeleteConfirmBox(true);
                          }
                        }}
                      >
                        {`Delete (${selectedRecords?.length})`}
                      </MenuItem>
                    )}
                    {accountPermissions?.isUpdate && accountResource === 'customerAccount' && permissions?.productInventory && (
                      <MenuItem
                        disabled={selectedRecords?.length === 0}
                        onClick={() => {
                          setOpenAddPlantsDialog(true);
                          closeActions();
                        }}
                      >
                        Assign {routes.warehouse.title} &nbsp; <Chip size="small" label={selectedRecords?.length} />
                      </MenuItem>
                    )}
                    {accountPermissions?.isUpdate && (
                      <MenuItem
                        disabled={selectedRecords?.length === 0}
                        onClick={() => {
                          if (selectedRecords?.some((d) => d?.isAllowedToUpdate === false)) {
                            closeActions();
                            setShowDeleteWarningConfirmBox({ show: true, isDelete: false });
                          } else {
                            closeActions();
                            if (selectedRecords?.length) {
                              let entities = [];
                              selectedRecords?.map((current) => {
                                if (current?.entityId) {
                                  entities = [...entities, current?.entityId];
                                }
                                if (current?.restentity) {
                                  let restEntities = current?.restentity.map((o) => o.optionValue);
                                  entities = [...entities, ...restEntities];
                                }
                              });
                              setEntities([...entities]);
                            }
                            setShowEntityDialog(true);
                          }
                        }}
                      >
                        Assign Entity &nbsp; <Chip size="small" label={selectedRecords?.length} />
                      </MenuItem>
                    )}
                  </Menu>
                </div>
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
            isClientSideGrid={false}
            refreshGrid={fetchAccounts}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource[accountResource]}
          />
        ) : <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>}

        {showDeleteWarningConfirmBox?.show ? (
          <MessageDialog
            open={showDeleteWarningConfirmBox?.show}
            message={
              showDeleteWarningConfirmBox.isDelete
                ? `You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`
                : `You are trying to update records which you do not have permission to update, Please remove those records from selection and try again.`
            }
            onClose={() => setShowDeleteWarningConfirmBox({ show: false, isDelete: false })}
          />
        ) : null}

        {showDeleteConfirmBox ? (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete the selected account(s) ?`}
            onClose={() => setShowDeleteConfirmBox(false)}
            onOk={handleDeleteAccounts}
          />
        ) : null}

        {singleAccountDelete.show ? (
          <ConfirmationDialog
            open={singleAccountDelete.show}
            message={`Are you sure you want to delete the account: ${singleAccountDelete.accountName} ? `}
            onClose={() =>
              setSingleAccountDelete({
                id: null,
                show: false,
                accountName: ''
              })
            }
            onOk={handleSingleDeleteAccounts}
          />
        ) : null}

        {singleApproveDisapproveAccount.show ? (
          <ConfirmationDialog
            open={singleApproveDisapproveAccount.show}
            message={`Are you sure you want to ${singleApproveDisapproveAccount.approved ? 'approve' : 'disapprove'} account: ${singleApproveDisapproveAccount.accountName
              } ? `}
            onClose={() =>
              setSingleApproveDisapproveAccount({
                id: null,
                show: false,
                accountName: ''
              })
            }
            onOk={handleSingleApproveDisapproveAccount}
          />
        ) : null}

        {multipleApproveDisapproveAccount.show ? (
          <ConfirmationDialog
            open={multipleApproveDisapproveAccount.show}
            message={`Are you sure you want to ${multipleApproveDisapproveAccount.approved ? 'approve' : 'disapprove'} selected ${multipleApproveDisapproveAccount.selectedRecords
              } account(s) ? `}
            onClose={() =>
              setMultipleApproveDisapproveAccount({
                show: false,
                approved: false,
                selectedRecords: 0
              })
            }
            onOk={approveDisapproveAccounts}
          />
        ) : null}

        {isAccDialogVisible ? (
          <ManageAccountDialog
            open={isAccDialogVisible}
            onClose={handleDialogClose}
            id={cloneId}
            accountResource={accountResource}
            accountApi={accountApi}
            isClone={cloneId ? true : false}
            accountNameForClone={accountNameForClone}
          />
        ) : null}

        {openAddPlantsDialog && (
          <WarhouseList
            isCustomer={false}
            api="/warehouse"
            isAddingWarehouse={isAddingWarehouse}
            addWarehouse={(selectedPlants: any) => {
              setAddingWarehouse(true);
              axiosInstance()
                .post(`/customer-account/assign-warehouse`, {
                  ids: selectedRecords?.map((d: any) => d._id),
                  warehouse: selectedPlants.map((d: any) => d._id)
                })
                .then(() => {
                  fetchAccounts();
                  setAddingWarehouse(false);
                  setOpenAddPlantsDialog(false);
                })
                .catch((err) => {
                  toastConfig.setToastConfig(err);
                  setAddingWarehouse(false);
                  setOpenAddPlantsDialog(false);
                });
            }}
            onClose={() => setOpenAddPlantsDialog(false)}
            assignedWarehouse={[]}
          />
        )}

        {showEntityDialog ? (
          <EntitySelectionsDialog
            open={showEntityDialog}
            resource={sidebarResource[accountResource]}
            resourceIds={selectedRecords?.length ? selectedRecords?.map((o) => o._id) : [accountId]}
            onClose={() => {
              setShowEntityDialog(false);
              setAccountId('');
            }}
            onSuccess={fetchAccounts}
            entities={entities}
          />
        ) : null}
      </CustomContainer>
    </section>
  );
}
