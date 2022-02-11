import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import { SearchFilter } from '../../../components/Activity/Report/SearchFilter';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { GetReferenceName, GetEmails } from '../../../axios/activity';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import { useData } from '../../../StateProvider/Provider';
import CustomContainer from '../../../components/CustomContainer';
import { Button, MenuItem, Menu, Typography, Tooltip, IconButton, TextField, Chip, Link } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import axiosInstance from '../../../axios/axiosInstance';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import MessageDialog from '../../../components/Helpers/MessageDialog';
import { Delete as DeleteIcon } from '@material-ui/icons';
import reactHtmlparser, { convertNodeToElement } from 'react-html-parser';
import { HiOutlineMail } from 'react-icons/hi';
import Dialog from '@material-ui/core/Dialog';
import { CreateEmail } from '../../../components/Activity/Email/CreateEmail';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { getApi, getData, isObjectEmpty, resourceOptions } from '../../../constants/helpers';
import styles from '../../Leads/Header.module.scss';
import emailStyles from './email.module.scss';
import './email.scss';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import { AddOutlined } from '@material-ui/icons';
import { displayDate } from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import { MdAccountCircle } from 'react-icons/md';
import { AiFillCrown, MdAdd } from 'react-icons/all';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import { Autocomplete } from '@material-ui/lab';
import { camelCase } from 'lodash';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { startCase } from "lodash";

const tabs = {
  Inbox: 1,
  Sent: 2
};



const Email = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();
  const parsed = queryString.parse(history.location.search);
  const { referenceType, referenceId } = parsed;

  const [filter, setFilter] = useState([]);
  const [inboxEmails, setInboxEmails] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [emailId, setEmailId] = useState(null);
  const [currentTab, setCurrentTab] = useState(1);
  const [emailUsersOptions, setEmailUsersOptions] = useState([]);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows } = state;
  const columnState = JSON.parse(localStorage.getItem('emailPage'));

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [clonedData, setClonedData] = useState([]);
  const localStorageSelectedRecords = 'emailPage_selected';
  const [resource, setResource] = useState('');
  const [resourceData, setResourceData] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceData, setSelectedResourceData] = useState(null);
  const [columns] = useState([
    { field: 'to', headerName: 'Recipient', show: true, disabled: true, cellRenderer: 'recipentRenderer' },
    { field: 'relatedTo', headerName: 'Related To', show: true, disabled: true, primaryField: true, cellRenderer: 'referenceRenderer' },
    {
      field: 'subject',
      headerName: 'Subject',
      show: true,
      primaryField: true,
      cellRenderer: 'subjectRenderer'
    },
    // {
    //   field: 'message',
    //   headerName: 'Message',
    //   show: true,
    //   // sortable: false,
    //   cellRenderer: 'messageRenderer'
    // },
    {
      field: 'createdBy',
      headerName: 'Created At',
      show: true,
      filter: false,
      sortable: false,
      cellRenderer: 'createdByDate'
    }
  ]);

  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }



  let newResourceOptions = [];

  for (let i = 0; i < resourceOptions.length; i++) {
    if (resourceOptions[i] === 'Customer Account') {
      if (permissions.customerAccount.isRead === true) {
        newResourceOptions.push(resourceOptions[i]);
        i++;
      }
    }
    if (resourceOptions[i] === 'Customer Contact') {
      if (permissions.customerContact.isRead === true) {
        newResourceOptions.push(resourceOptions[i]);
      }
    }
    if (resourceOptions[i] === 'Supplier Account') {
      if (permissions.supplierAccount.isRead === true) {
        newResourceOptions.push(resourceOptions[i]);
      }
    }
    if (resourceOptions[i] === 'Supplier Contact') {
      if (permissions.supplierContact.isRead === true) {
        newResourceOptions.push(resourceOptions[i]);
      }
    }
    if (resourceOptions[i] === 'Lead') {
      if (permissions.lead.isRead === true) {
        newResourceOptions.push(resourceOptions[i]);
      }
    }
    if (resourceOptions[i] === 'Opportunity') {
      if (permissions.opportunity.isRead === true) {
        newResourceOptions.push(resourceOptions[i]);
      }
    }
    if (resourceOptions[i] === 'Customer Account') {
      if (permissions.customerAccount.isRead === true) {
        newResourceOptions.push(resourceOptions[i]);
      }
    }
    if (resourceOptions[i] === 'Quote') {
      if (permissions.quoteBuilder.isRead === true) {
        newResourceOptions.push(resourceOptions[i]);
      }
    }
    if (resourceOptions[i] === 'Rental Management') {
      if (permissions.rentalManagement.isRead === true) {
        newResourceOptions.push(resourceOptions[i]);
      }
    }
    if (resourceOptions[i] === 'Delivery Ticket') {
      if (permissions.deliveryTicket.isRead === true) {
        newResourceOptions.push(resourceOptions[i]);
      }
    }
    if (resourceOptions[i] === "Project Sales") {
      if (permissions.projectSales.isRead === true) {
        newResourceOptions.push(resourceOptions[i]);
      }
    }
  }









  useEffect(() => {
    fetchUsersEmails();
  }, []);

  useEffect(() => {
    if (referenceType) {
      GetReferenceName(referenceType, referenceId)
        .then(({ data }) => {
          setFilter([{ _id: referenceId, type: referenceType, name: data.name }]);
        })
        .catch((err) => { });
    }
  }, [referenceId]);

  useEffect(() => {
    fetchEmails();
  }, [page, limit, filters, filter, sorting]);

  useEffect(() => {
    if (!resource) return;
    setLoadingResources(true);
    axiosInstance()
      .get(`${getApi(resource)}?limit=100`)
      .then(({ data: { data } }) => {
        if (data.length) {
          const mappedData = data.map((_d) => getData(resource, _d));
          setResourceData(mappedData || []);
        }
        setLoadingResources(false);
      })
      .catch((error) => {
        setLoadingResources(false);
      });

    return () => {
      setSelectedResourceData(null);
      setResourceData(null);
    };
    // eslint-disable-next-line
  }, [resource]);

  const redirectToResource = (type, id) => {
    history.push(
      type === "quote" ? `${routes["quoteBuilder"].path}/detail/${id}`
        : `${routes[type].path}/detail/${id}`
    )
  }

  const fetchEmails = async () => {
    const queryString = getQueryString();
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }
    await GetEmails(JSON.stringify(filter), queryString)
      .then(({ data, count }) => {
        let inboxEmailsData = [],
          sentEmails = [];
        data = data.forEach((obj) => {
          const { createdBy, ...rest } = obj;
          let isCreatedByMe = obj?.createdBy?.user === user?.user?._id ? true : false;
          let currentObject = {
            ...rest,
            id: obj._id,
            createdByDate: obj?.createdBy?.date ?? '',
            createdByUser: obj?.createdBy?.user,
            isCreatedByMe
          };
          inboxEmailsData.push(currentObject);
          // if (isCreatedByMe) sentEmails.push(currentObject);
          // else inboxEmailsData.push(currentObject);
        });
        dispatch({
          type: 'initialize',
          data: currentTab === tabs.Inbox ? inboxEmailsData : sentEmails,
          count: currentTab === tabs.Inbox ? inboxEmailsData.length : sentEmails.length
        });
        setSentEmails(sentEmails);
        setInboxEmails(inboxEmailsData);

        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const handleChangeFilter = (value) => {
    if (page !== 0) dispatch({ type: 'pageChange', page: 0 });
    setFilter(value);
  };

  const getToEmailList = (toList) => {
    return (currentTab === tabs.Sent ? 'To: ' : '') + toList.map((email) => (email === user?.user?.email ? 'me' : email)).join(',');
  };

  const transform = (node, index) => {
    if (node.type === 'tag' && ['h2', 'h1', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'del', 'img'].indexOf(node.name) >= 0) {
      node.name = 'p';
      return convertNodeToElement(node, index, transform);
    }
  };

  const ActionsRenderer = (params) => (
    <>
      <Tooltip title="Delete">
        <IconButton size="small" aria-label="Delete" onClick={() => showConfirmBox(params.data)}>
          <DeleteIcon fontSize="small" color="error" />
        </IconButton>
      </Tooltip>
    </>
  );

  const RecipentRenderer = (params) => (
    <span
      className="link cursor-pointer"
      onClick={(e) => {
        if (permissions?.email?.isUpdate) {
          setOpen(true);
          setEmailId(params.data.id);
        }
      }}
    >
      {typeof params.data.to === 'string' ? (
        <span> {params.data.to}</span>
      ) : (
        <span>{params.data?.isCreatedByMe ? getToEmailList(params.data.to) : params.data?.mailbox ?? ''}</span>
      )}
    </span>
  );

  const SubjectRenderer = (params) => (
    <div className={emailStyles.emailMessageConatiner}>
      <Typography> {params.data?.subject ?? '(no subject) '} </Typography>
    </div>
  );

  const MessageRenderer = (params) => (
    <div className={emailStyles.emailMessageConatiner}>
      <Typography display="inline" className={emailStyles.emailMessage}>
        {params.data.message ? reactHtmlparser(params.data.message, { transform }) : null}
      </Typography>
    </div>
  );

  const ReferenceRenderer = (params) => (
    <>{params.value && params.value?.length > 0 ? params.value.map(d => {
      return (
        <>
          <Link
            className="link text-truncate"
            onClick={() => redirectToResource(d?.type, d?.referenceId)}

          >
            {d?.salutation ? `${d?.saluation} ${d?.name}` : d?.name}
          </Link>
          <Chip
            className="ml-3"
            color="primary"
            label={`${startCase(d.type)}`}
          />
        </>
      )
    })
      : <NoDataCell />
    }
    </>
  );

  const CreatedByDateRenderer = (params) => <span className={emailStyles.emailCreatedAt}>{displayDate(params.data?.createdByDate)}</span>;

  const frameworkComponents = {
    recipentRenderer: RecipentRenderer,
    referenceRenderer: ReferenceRenderer,
    subjectRenderer: SubjectRenderer,
    messageRenderer: MessageRenderer,
    createdByDate: CreatedByDateRenderer,
    actionsRenderer: ActionsRenderer
  };

  const getQueryString = () => {
    let deepFilter = `&page=${page}&limit=${limit}`;

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        if (filters[field].filter.toLowerCase() === 'me') {
          filters[field].filter = user?.user?.email;
        }
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    return deepFilter;
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row.id) {
        setDeleteRecord(row);
      }
    } else {
      setIsConformDialogVisible(true);
    }
  };

  const fetchUsersEmails = () => {
    axiosInstance()
      .get('/user')
      .then(({ data: { data, count } }) => {
        data = data.reduce((emails, obj) => {
          if (obj?.email && emailUsersOptions.indexOf(obj.email) < 0) emails.push(obj.email);
          return emails;
        }, []);
        setEmailUsersOptions((prevState) => {
          return [...prevState, ...data];
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDeleteEmails = async () => {
    setDeleteLoading(true);

    if (deleteRecord?.id || selectedRecords.length > 0) {
      axiosInstance()
        .put('/email', { emails: deleteRecord?.id ? [deleteRecord.id] : selectedRecords.map((d) => d._id) })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'Email deleted successfully'
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchEmails();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  const handleClose = () => {
    setEmailId(null);
    setOpen(false);
  };

  const handleTab = (e, currentTab) => {
    dispatch({
      type: 'initialize',
      data: currentTab === tabs.Sent ? sentEmails : inboxEmails,
      count: currentTab === tabs.Sent ? sentEmails.length : inboxEmails.length
    });
    setCurrentTab(currentTab);
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item xs={12}>
          <CustomBreadCrumbs routes={[{ title: routes.activityEmail.title }]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} sm={12} md={6} className="d-flex align-items-center gap-1">
              <HiOutlineMail className="headerLogo" /> <span className="listingHeader">{routes.activityEmail.title}</span>
              <Autocomplete
                options={newResourceOptions}
                getOptionLabel={(option) => option}
                style={{ width: "200px" }}
                value={resource}
                onChange={(event, newValue) => {
                  setResource(newValue);
                }}
                size="small"
                renderInput={(params) =>
                  isMobile && !isTablet ? (
                    <TextField {...params} label="Select Resource" variant="standard" className={isMobile ? 'serchBox' : ''} />
                  ) : (
                    <TextField {...params} label="Select Resource" variant="outlined" />
                  )
                }
              />
              {Boolean(resource) && resourceData && (
                <Autocomplete
                  disabled={loadingResources}
                  options={resourceData}
                  getOptionLabel={(option: any) => option.name}
                  getOptionSelected={(option: any, value: any) => option.name === value.name}
                  style={{ width: "200px" }}
                  value={selectedResourceData}
                  onChange={(event, newValue) => {
                    setSelectedResourceData(newValue);
                    if (newValue?.id) {
                      setFilter((prevState) => ([...prevState, { _id: newValue.id, type: camelCase(resource), name: newValue.name }]))
                    }
                    else {
                      setFilter([])
                    }
                  }}
                  size="small"
                  renderInput={(params) => <TextField {...params} label={`Select ${resource}`} variant="outlined" />}
                />
              )}
            </Grid>
            <Grid item xs={12} md={6} sm={12} className={styles.filter_side}>
              <Box component="div" className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} style={{ width: '100%' }}>
                <Grid style={{ width: '100%', display: 'flex' }}>
                  <SearchFilter
                    handleChangeFilter={handleChangeFilter}
                    filter={filter}
                    chip={{ size: 'large' }}
                    activityName="email" />
                </Grid>
                <Grid style={{ display: 'flex', gap: '5px' }}>
                  {
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      color="primary"
                      size="small"
                      onClick={() => {
                        setOpen(true);
                      }}
                      className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                      startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    >
                      {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                    </Button>
                  }
                  {/* </Box> */}
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'outlined'}
                    color="default"
                    size="small"
                    onClick={openActions}
                    aria-controls="action-menu"
                    disabled={selectedRecords.length > 0 ? false : true}
                    className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                  >
                    {isMobile && !isTablet ? '' : 'Actions'} <ExpandMore />
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
                        showConfirmBox(null);
                        closeActions();
                      }}
                    >
                      Delete
                    </MenuItem>
                  </Menu>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </div>
        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions.note}
            primaryField={columns?.find((d) => d.primaryField)}
            onClick={(data) => { }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={false}
            extraParamsToCheckDelete={true}
            onDelete={(data) => {
              showConfirmBox(data);
            }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            onCreate={false}
            showClone={false}
            onClone={false}
            renderedFrom={'emailPage'}
            chips={false}
          />
        ) : (
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
            actionWidth={150}
            loading={loading}
            renderedFrom="emailPage"
            refreshGrid={fetchEmails}
          />
        )}
        {showDeleteWarningConfirmBox ? (
          <MessageDialog
            open={showDeleteWarningConfirmBox}
            message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
            onClose={() => setShowDeleteWarningConfirmBox(false)}
          />
        ) : null}
        {isConfirmDialogVisible ? (
          <ConfirmationDialog
            open={isConfirmDialogVisible}
            message={`Are you sure you want to delete ${deleteRecord?.id ? 'this email' : 'these emails'}?`}
            onClose={() => {
              if (deleteRecord) setDeleteRecord({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteEmails}
          />
        ) : null}
        {open ? (
          <Dialog
            open={open}
            fullScreen={fullScreen || isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            maxWidth="md"
            onClose={() => {
              handleClose();
              setFullScreen(false);
            }}
            fullWidth
          >
            <CreateEmail
              emailId={emailId}
              handleClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              fetchData={fetchEmails}
              relatedTo={[
                {
                  type: resource && selectedResourceData ? camelCase(resource) : "user",
                  referenceId: resource && selectedResourceData ? selectedResourceData.id : user?.user?._id,
                  access: true,
                },
              ]}
              options={emailUsersOptions}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          </Dialog>
        ) : null}
      </CustomContainer>
    </Fragment>
  );
};

export default Email;
