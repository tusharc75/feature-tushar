import React, { useContext, useEffect, useState, useReducer } from 'react';
import { useData } from '../../StateProvider/Provider';
import { Button, Menu, MenuItem, Tooltip, IconButton, Grid, Chip, MenuList } from '@material-ui/core';
import ReactGa from 'react-ga';
import { Link } from 'react-router-dom';
import { ExpandMore, AddOutlined } from '@material-ui/icons';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import SearchBox from '../../components/Helpers/SearchBox';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ManageAccountDialog from './ManageAccount/index';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import CancelIcon from '@material-ui/icons/Cancel';
import accountClass from './account.module.scss';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { FcApproval } from 'react-icons/fc';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import { MdAccountCircle } from 'react-icons/md';
import { gridLoadingTimeout } from '../../constants/helpers';
import NoDataCell from '../../components/Helpers/NoDataCell';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import routes from './../../components/Helpers/Routes';
import { isObjectEmpty } from '../../constants/helpers';
import {
  CommonRenderer,
  CreatedByRenderer,
  UpdatedByRenderer,
  CommonRendererWithCopy
} from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import styles from '../Leads/Header.module.scss';

const AccTypes = [
  {
    key: 'All Accounts',
    value: 1
  },
  {
    key: 'My Accounts',
    value: 2
  }
];

const options = ['All', 'Approved', 'Disapproved'];

let accountTimeout;
export default function Account(props) {
  const toastConfig = useContext(CustomToastContext);

  const {
    account: { accountApi, accountResource, accountRoute }
  } = props;

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [cloneId, setCloneId] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [type, setType] = useState(options[0]);
  const [renderCount, setRenderCount] = useState(0);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [isAccDialogVisible, setIsAccDialogVisible] = useState(false);
  const [selectedType, setselectedType] = useState(1);

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
    approveAccount: false,
  });
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [filter, setFilter] = useState('All Accounts');

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  // const [showGridFilters, setShowGridFilters] = useState(true)
  const columnState = JSON.parse(localStorage.getItem(accountResource));

  const columns = [
    { field: 'accountName', headerName: 'Account Name', show: true, disabled: true, cellRenderer: 'accountNameRenderer' },
    { field: 'lead', headerName: 'Related Lead', show: true, cellRenderer: 'leadRenderer' },
    { field: 'typeOfAccount', headerName: 'Type', show: true, cellRenderer: 'commonRenderer' },
    { field: 'entity', headerName: 'Entity Name', show: true, cellRenderer: 'commonRenderer' },
    { field: 'industry', headerName: 'Industry', show: true, cellRenderer: 'commonRenderer' },
    { field: 'createdBy', headerName: 'Created By', show: true, cellRenderer: 'createdByRenderer' },
    { field: 'updatedBy', headerName: 'Updated By', show: true, cellRenderer: 'updatedByRenderer' },
    { field: 'parentAccount', headerName: 'Parent Account', show: true, cellRenderer: 'parentAccountRenderer' },
    { field: 'masterAccount', headerName: 'Master Account', show: true, cellRenderer: 'masterAccountRenderer', filter: false, sortable: false },
    { field: 'phone', headerName: 'Phone', show: true, cellRenderer: 'commonRendererWithCopy' }
  ];

  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId == item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  //  Grid Variables - End

  useEffect(() => {
    if (permissions) {
      setAccountPermissions(permissions[accountResource]);
    }
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;

    if (accountTimeout) {
      clearTimeout(accountTimeout);
    }

    accountTimeout = setTimeout(() => {
      fetchAccounts();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchAccounts();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, type, filters, sorting, selectedEntity]);

  const AccountNameRenderer = (params) => (
    <span className="d-flex gap-2 align-items-center">
      <Link className="link" to={`/${accountRoute}/detail/${params.data._id}`}>
        <CustomRenderCell value={params.value} />
      </Link>
      {params.data.approved && <FcApproval title="Approved" size={20} />}
    </span>
  );

  const LeadRenderer = (params) =>
    params.value ? (
      <Link className="link" to={`${routes.leadDetail.path}/${params.data.leadId}`} title={params.value}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const ParentAccountRenderer = (params) =>
    params.value ? (
      <Link className="link" to={`/${accountRoute}/detail/${params.data.parentAccountId}`} title={params.value}>
        <CustomRenderCell value={params.value} />
      </Link>
    ) : (
      <NoDataCell />
    );

  const MasterAccountRenderer = (params) =>
    params.value ? (
      <Link className="link" to={`/${accountRoute}/detail/${params.data.masterAccountId}`} title={params.value}>
        <CustomRenderCell value={params.value} />
      </Link>
    ) : (
      <NoDataCell />
    );

  const ActionsRenderer = (params) => (
    <>
      {accountPermissions.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              cloneAccount(params.data._id);
            }}
          >
            <FileCopyIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to clone/create an account">
          <IconButton aria-label="Clone" size="small">
            <FileCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {accountPermissions.isUpdate && accountPermissions.approveAccount && params.data.approved ? (
        <Tooltip title="Disapprove">
          <IconButton
            aria-label="Disapprove"
            onClick={() => {
              setSingleApproveDisapproveAccount({
                show: true,
                approved: false,
                id: params.data._id,
                accountName: params.data.accountName
              });
            }}
          >
            <CancelIcon fontSize="inherit" color="error" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Approve">
          <IconButton
            aria-label="Approve"
            onClick={() => {
              setSingleApproveDisapproveAccount({
                show: true,
                approved: true,
                id: params.data._id,
                accountName: params.data.accountName
              });
            }}
          >
            <FcApproval />
          </IconButton>
        </Tooltip>
      )}

      <GridDeleteIcon
        hasDeletePermission={accountPermissions.isDelete}
        ownerId={params.data.ownerId}
        userId={user?.user?._id}
        onDelete={() => {
          setSingleAccountDelete({
            show: true,
            id: params.data._id,
            accountName: params.data.accountName
          });
        }}
        entity="account"
      />
    </>
  );

  const frameworkComponents = {
    accountNameRenderer: AccountNameRenderer,
    leadRenderer: LeadRenderer,
    commonRenderer: CommonRenderer,
    commonRendererWithCopy: CommonRendererWithCopy,
    parentAccountRenderer: ParentAccountRenderer,
    masterAccountRenderer: MasterAccountRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer
  };

  const replaceFieldName = (field) => {
    switch (field) {
      case 'createdBy':
        return 'createdBy.user.concatedName';

      case 'updatedBy':
        return 'updatedBy.user.concatedName';

      case 'lead':
        return 'staticData.lead.concatedName';

      default:
        return field;
    }
  };

  const replaceFieldNameForSorting = (field) => {
    const updatedField = replaceFieldName(field);

    if (field !== updatedField) return updatedField;

    switch (field) {
      case 'owner':
        return 'owner.optionLabel';

      case 'parentAccount':
        return 'parentAccount.optionLabel';
      case 'entity':
        return 'entity.optionLabel';

      default:
        return field;
    }
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&filterAccounts=${selectedType}`;

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const updatedFilters = [];
    if (type !== options[0]) {
      updatedFilters.push({ field: 'staticData.approved', term: type === 'Approved' });
    }

    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
    }
    deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`;

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    return deepFilter;
  };

  const menuOptionSelection = (selectedOption) => {
    setType(options[selectedOption]);
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


    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${accountApi}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          const { owner, collaborator, createdBy, updatedBy, staticData, parentAccount, parentHierarchy, entity, ...restProperties } = u;

          let res = {
            ...restProperties,
            id: u._id,

            owner: u.owner?.optionLabel,
            ownerId: u.owner?.optionValue,
            canDelete: u.owner?.optionValue === user?.user._id,

            isAllowedToUpdate: [...(u.collaborator ?? []), u.owner].some((d) => d?.optionValue == user?.user?._id),
            lead: u.staticData && u.staticData.lead && u.staticData.lead.concatedName,
            leadId: u.staticData && u.staticData.lead && u.staticData.lead._id,

            approved: u.staticData?.approved,

            parentAccount: parentAccount?.optionLabel,
            parentAccountId: parentAccount?.optionValue,

            entity: entity?.optionLabel,
            masterAccount: u.parentHierarchy.length > 0 ? u.parentHierarchy.find((d) => d.parentAccount === '')?.accountName : '',
            masterAccountId: u.parentHierarchy.length > 0 ? u.parentHierarchy.find((d) => d.parentAccount === '')?._id : '',

            createdBy: u.createdBy?.user?.concatedName,
            createdByDate: u.createdBy?.date,
            updatedBy: u.updatedBy?.user?.concatedName,
            updatedByDate: u.updatedBy?.date
          };
          return res;
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

  const cloneAccount = async (accountId) => {
    setCloneId(accountId);
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
    ReactGa.event({
      category: 'Account Button',
      action: 'clicked'
    });
    setIsAccDialogVisible(true);
  };

  const handleDeleteAccounts = async () => {
    let selectedAccounts = selectedRecords.map((cr) => cr._id);

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

  const handleAccountSelect = (filterValues) => {
    setselectedType(filterValues);
  };

  const approveDisapproveAccounts = () => {
    const selectedAccountIds = dataRows.filter((d) => d.approved === !multipleApproveDisapproveAccount.approved).map((m) => m._id);

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

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      handleAccountSelect(AccTypes.find((d) => d.key === newFilter).value);
    }
  };

  return (
    <>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: routes[accountResource].title }]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={accountPermissions}
            module="account(s)"
            api={accountApi}
            afterImportCompleted={() => {
              fetchAccounts();
            }}
          />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className={`${accountClass['account_header_inner_container']}`}>
          <Grid container className="header-panel" justify="space-between" alignContent="center">
            <Grid item md={6} sm={6} xs={12} className="d-flex align-items-center gap-1">
              <div className={`${accountClass.account_header} ${accountClass['account_header-mobile']}`}>
                <MdAccountCircle className="headerLogo" /> <span className="listingHeader">{routes[accountResource].title}</span>
                <div className={`d-flex align-items-center gap-1 ${accountClass.account_header_add_btn_action_btn_group}`}>
                  {AccTypes && (
                    <ToggleButtonGroup
                      size="small"
                      className={`ml-8 ${accountClass.accountActions}`}
                      value={filter}
                      exclusive
                      onChange={handleFilter}
                    >
                      {AccTypes.map((k: any, index) => {
                        return (
                          <ToggleButton value={k.key} key={index}>
                            {k.key}
                          </ToggleButton>
                        );
                      })}
                    </ToggleButtonGroup>
                  )}
                  <ButtonGroup
                    size="small"
                    className={accountClass.accountActions}
                    variant="outlined"
                    color="primary"
                    ref={anchorRef}
                    aria-label="small outlined button group"
                  >
                    <Button>{options[selectedIndex]}</Button>
                    <Button
                      color="primary"
                      size="small"
                      aria-controls={open ? 'split-button-menu' : undefined}
                      aria-expanded={open ? 'true' : undefined}
                      aria-label="select merge strategy"
                      aria-haspopup="menu"
                      onClick={handleToggle}
                    >
                      <ArrowDropDownIcon />
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
                                <MenuItem
                                  key={option}
                                  selected={index === selectedIndex}
                                  onClick={(event) => handleMenuItemClick(event, index)}
                                  style={{ color: 'black' }}
                                >
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
            </Grid>
            <Grid item md={6} sm={6} xs={12} className="d-flex align-items-center gap-1" justify="flex-end">
              <div className={`${accountClass.account_header} ${accountClass['account_header-mobile']}`}>
                <SearchBox onSearch={handleSearch} searchbox="account_header_search_bar" width="300px" value={search} />
                <div className={`d-flex align-items-center gap-1 ${accountClass.account_header_add_btn_action_btn_group}`}>
                  {accountPermissions.isCreate && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      className={styles.add_submit_btn}
                      onClick={clickCreateNew}
                      startIcon={<AddOutlined />}
                    >
                      Add
                    </Button>
                  )}

                  {(accountPermissions.isDelete || accountPermissions.approveAccount) && (
                    <Button
                      disabled={selectedRecords.length === 0}
                      variant="outlined"
                      color="default"
                      size="small"
                      className={styles.add_submit_btn}
                      onClick={openActions}
                      aria-controls="action-menu"
                    >
                      Actions <ExpandMore />
                    </Button>
                  )}
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
                    {accountPermissions.isUpdate && accountPermissions.approveAccount && (
                      <MenuItem
                        disabled={selectedRecords.filter((d) => !d.approved).length === 0}
                        onClick={() => {
                          closeActions();
                          setMultipleApproveDisapproveAccount({
                            show: true,
                            approved: true,
                            selectedRecords: selectedRecords.filter((d) => !d.approved).length
                          });
                        }}
                      >
                        Approve Accounts &nbsp; <Chip size="small" label={selectedRecords.filter((d) => !d.approved).length} />
                      </MenuItem>
                    )}
                    {accountPermissions.isUpdate && accountPermissions.approveAccount && (
                      <MenuItem
                        disabled={selectedRecords.filter((d) => d.approved).length === 0}
                        onClick={() => {
                          closeActions();
                          setMultipleApproveDisapproveAccount({
                            show: true,
                            approved: false,
                            selectedRecords: selectedRecords.filter((d) => d.approved).length
                          });
                        }}
                      >
                        Disapprove Accounts &nbsp; <Chip size="small" label={selectedRecords.filter((d) => d.approved).length} />
                      </MenuItem>
                    )}
                    {accountPermissions.isDelete && (
                      <MenuItem
                        disabled={selectedRecords.length === 0}
                        onClick={() => {
                          if (selectedRecords.some((d) => d.canDelete === false)) {
                            closeActions();
                            setShowDeleteWarningConfirmBox(true);
                          } else {
                            closeActions();
                            setShowDeleteConfirmBox(true);
                          }
                        }}
                      >
                        Delete
                      </MenuItem>
                    )}
                  </Menu>
                </div>
              </div>
            </Grid>
          </Grid>

          {/* <CustomHeader
              total={rowCount}
              heading={sidebarResource[accountResource]}
              selectedType={selectedType}
              onTypeChange={handleAccountSelect}
              options={AccTypes}
              secondHeading="Account"
              icon={<MdAccountCircle className="headerLogo" />}
            >
            </CustomHeader> */}
        </div>

        <CustomAgGrid
          columns={columns}
          dataRows={dataRows}
          frameworkComponents={frameworkComponents}
          setGridApi={setGridApi}
          dispatch={dispatch}
          rowCount={rowCount}
          limit={limit}
          pageSizes={pageSizes}
          page={page}
          loading={loading}
          renderedFrom={accountResource}
        />

        {showDeleteWarningConfirmBox ? (
          <MessageDialog
            open={showDeleteWarningConfirmBox}
            message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
            onClose={() => setShowDeleteWarningConfirmBox(false)}
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
          />
        ) : null}
      </CustomContainer>
    </>
  );
}
