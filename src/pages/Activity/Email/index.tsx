import React, { useState, useEffect, useContext, useReducer } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from '../../../components/Layout';
import { SearchFilter } from '../../../components/Activity/Report/SearchFilter';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { GetReferenceName, GetEmails } from '../../../axios/activity';
import moment from 'moment';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import { useData } from '../../../StateProvider/Provider';
import CustomContainer from '../../../components/CustomContainer';
import { Button, MenuItem, Menu, Typography, Tooltip, IconButton } from '@material-ui/core';
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
import { gridPageSizes, isObjectEmpty } from '../../../constants/helpers';
import styles from '../../Leads/Header.module.scss';
import emailStyles from './email.module.scss';
import './email.scss';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import { AddOutlined } from '@material-ui/icons';
import { displayDate } from '../../../constants/helpers';

const tabs = {
  Inbox: 1,
  Sent: 2
};

const Email = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user }
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
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
  const columnState = JSON.parse(localStorage.getItem('emailPage'));

  const [columns, setColumns] = useState([
    { field: 'to', headerName: 'Recipient', show: true, disabled: true, cellRenderer: 'recipentRenderer' },
    {
      field: 'subject',
      headerName: 'Subject',
      show: true,
      cellRenderer: 'subjectRenderer'
    },
    {
      field: 'message',
      headerName: 'Message',
      show: true,
      // sortable: false,
      cellRenderer: 'messageRenderer'
    },
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
    columns.map((item) => {
      columnState.map((d) => {
        if (d.colId == item.field) {
          item.show = !d.hide;
        }
      });
    });
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
        .catch((err) => {});
    }
  }, [referenceId]);

  useEffect(() => {
    fetchEmails();
  }, [page, limit, filters, filter, sorting]);

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
          if (isCreatedByMe) sentEmails.push(currentObject);
          else inboxEmailsData.push(currentObject);
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
    if (node.type === 'tag' && ['h2', 'h1', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'del'].indexOf(node.name) >= 0) {
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
        setOpen(true);
        setEmailId(params.data.id);
      }}
    >
      {typeof params.data.to == 'string' ? (
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

  const CreatedByDateRenderer = (params) => <span className={emailStyles.emailCreatedAt}>{displayDate(params.data?.createdByDate)}</span>;

  const frameworkComponents = {
    recipentRenderer: RecipentRenderer,
    subjectRenderer: SubjectRenderer,
    messageRenderer: MessageRenderer,
    createdByDate: CreatedByDateRenderer,
    actionsRenderer: ActionsRenderer
  };

  const getQueryString = () => {
    let deepFilter = `&page=${page}&limit=${limit}`;

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).map((field) => {
        if (filters[field].filter.toLowerCase() === 'me') {
          filters[field].filter = user?.user?.email;
        }
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`;
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
            message: 'Email deleted succesfully'
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
    <Layout>
      <Grid container className="headerbox">
        <Grid item xs={12}>
          <CustomBreadCrumbs routes={[{ title: 'Email' }]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} sm={6} md={6} className="d-flex align-items-center gap-1">
              <HiOutlineMail className="headerLogo" /> <span className="listingHeader">Email</span>
              <ToggleButtonGroup size="small" className="ml-8" value={currentTab} exclusive onChange={handleTab}>
                {Object.keys(tabs).map((k, index) => (
                  <ToggleButton value={tabs[k]} key={index} className="l-2">
                    {k} {currentTab === tabs[k] ? `(${rowCount})` : ''}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={6} className={styles.filter_side}>
              <Box component="div" className={styles.filter_side_header} style={{ width: '100%' }}>
                {/* <Box style={{ width: '70%' }}> */}
                <SearchFilter handleChangeFilter={handleChangeFilter} filter={filter} chip={{ size: 'small' }} />
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  className={styles.add_submit_btn}
                  onClick={() => {
                    setOpen(true);
                  }}
                  startIcon={<AddOutlined />}
                >
                  Add
                </Button>
                {/* </Box> */}
                <Button
                  className={styles.action_submit_btn}
                  variant="outlined"
                  color="default"
                  size="small"
                  onClick={openActions}
                  aria-controls="action-menu"
                  disabled={selectedRecords.length > 0 ? false : true}
                >
                  Actions <ExpandMore />
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
              </Box>
            </Grid>
          </Grid>
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
          actionWidth={150}
          loading={loading}
          renderedFrom="emailPage"
        />

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
            fullScreen={isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            maxWidth="md"
            onClose={handleClose}
            fullWidth
          >
            <CreateEmail
              emailId={emailId}
              handleClose={handleClose}
              fetchData={fetchEmails}
              relatedTo={[{ type: 'my', name: user?.user?._id }]}
              options={emailUsersOptions}
            />
          </Dialog>
        ) : null}
      </CustomContainer>
    </Layout>
  );
};

export default Email;
