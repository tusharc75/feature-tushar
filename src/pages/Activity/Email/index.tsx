import { Box, Chip, IconButton, MenuItem, TextField } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import { Delete as DeleteIcon } from '@material-ui/icons';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { convertNodeToElement } from 'react-html-parser';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import { GetEmails, GetReferenceName } from '../../../axios/activity';
import axiosInstance from '../../../axios/axiosInstance';
import { CreateEmail } from '../../../components/Activity/Email/CreateEmail';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import CustomContainer from '../../../components/CustomContainer';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../../components/Helpers/MessageDialog';
import { isObjectEmpty, sidebarResource } from '../../../constants/helpers';

import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { Autocomplete } from '@material-ui/lab';
import { camelCase } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import { ViewEmail } from 'src/components/Activity/Email/ViewEmail';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { deleteDisable } from 'src/constants/messageHelpers';
import { get_activity_resource } from '../../../components/Activity/Helpers/utils';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { CustomDialogTransition, displayDate } from '../../../constants/helpers';
import './email.scss';

const tabs = {
  Inbox: 1,
  Sent: 2
};

const Email = () => {
  const renderedFrom = camelCase(routes?.activityEmail.title);
  const { state, dispatch } = useTableReducer();
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();
  const parsed = queryString.parse(history.location.search);
  const { referenceType, referenceId } = parsed;

  const [filter, setFilter] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [openViewEmail, setOpenViewEmail] = useState(false);
  const [emailId, setEmailId] = useState(null);
  const [currentTab, setCurrentTab] = useState(1);
  const [emailUsersOptions, setEmailUsersOptions] = useState([]);
  const { page, limit, search, filters, sorting, selectedRecords } = state;
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [fullScreenViewEmail, setFullScreenViewEmail] = useState(true);
  const [resource, setResource] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceData, setSelectedResourceData] = useState(null);
  const [columns, setColumns] = useState(null);

  const [resourceOptions, setResourceOptions] = useState([]);

  useEffect(() => {
    setResourceOptions(get_activity_resource(permissions));
  }, []);

  useEffect(() => {
    fetchGridColumns();
    fetchUsersEmails();
  }, []);

  useEffect(() => {
    if (referenceType) {
      GetReferenceName(referenceType, referenceId)
        .then(({ data }) => {
          setFilter([{ _id: referenceId, type: referenceType, name: data.name }]);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    } else {
      setFilter([]);
    }
  }, [referenceId]);

  useEffect(() => {
    if (filter) {
      fetchData();
    }
  }, [page, limit, filters, filter, sorting, search]);

  const fetchGridColumns = () => {
    const column = [
      {
        accessor: 'subject',
        Header: 'Subject',
        show: true,
        primaryField: true,
        Cell: ({ row }) => (
          <span
            className="link cursor-pointer"
            onClick={(e) => {
              if (permissions?.email?.isUpdate) {
                setOpenViewEmail(true);
                setEmailId(row.original.id);
              }
            }}
          >
            <p> {row.original?.subject ?? '(no subject) '} </p>
          </span>
        )
      },
      {
        accessor: 'to',
        Header: 'Recipient',
        show: true,
        disabled: true,
        Cell: ({ row }) => (
          <span>{typeof row.original?.to === 'string' ? <span> {row.original?.to}</span> : <span>{getToEmailList(row.original?.to)}</span>}</span>
        )
      },
      {
        accessor: 'relatedTo',
        Header: 'Related To',
        show: true,
        disabled: true,
        filter: false,
        sortable: false,
        Cell: ({ row }) => (
          <>
            {row.original?.relatedTo && row.original?.relatedTo?.length > 0 ? (
              row.original?.relatedTo.map((d) => {
                return (
                  <div style={{ display: 'flex', alignItems: 'center' }} key={d.name}>
                    <p>{d?.name}</p>
                    <IconButton className="ml-3" size="small" onClick={() => redirectToResource(d?.type, d?.referenceId)}>
                      <OpenInNewIcon fontSize="small" color="primary" />
                    </IconButton>
                    <Chip className="ml-3" color="primary" label={`${routes[d?.type]?.title}`} />
                  </div>
                );
              })
            ) : (
              <NoDataCell />
            )}
          </>
        )
      },
      {
        accessor: 'createdBy',
        Header: 'Created By',
        show: true,
        filter: false,
        sortable: false,
        Cell: ({ row }) => (
          <p>
            {row.original?.createdByUser?.concatedName}
            <span className="createdAtTime badge-date">{displayDate(row.original?.createdByDate)}</span>
          </p>
        )
      }
    ];
    setColumns([...column, ActionsRenderer]);
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
      <HtmlTooltip title={permissions.email.isDelete ? 'Delete' : deleteDisable}>
        <span>
          <IconButton disabled={!permissions.email.isDelete} size="small" aria-label="Delete" onClick={() => showConfirmBox(row.original)}>
            <DeleteIcon fontSize="small" color={permissions.email.isDelete ? 'error' : 'disabled'} />
          </IconButton>
        </span>
      </HtmlTooltip>
    )
  };

  useEffect(() => {
    if (resource && resource?.optionValue) {
      setLoadingResources(true);
      const lookupResource = sidebarResource[resource?.optionValue === 'quote' ? 'quoteBuilder' : resource?.optionValue];
      axiosInstance()
        .get(`/sa-formbuilder/lookup?lookupResource=${lookupResource}`)
        .then(({ data: { data } }) => {
          setResourceData(data[lookupResource] || []);
          setLoadingResources(false);
        })
        .catch((error) => {
          setLoadingResources(false);
        });

      return () => {
        setSelectedResourceData(null);
        setResourceData(null);
      };
    }
  }, [resource]);

  const redirectToResource = (type, id) => {
    window.open(type === 'quote' ? `${routes['quoteBuilder'].path}/detail/${id}` : `${routes[type].path}/detail/${id}`);
  };

  const fetchData = async () => {
    const queryString = getQueryString();
    dispatch({ type: 'loading', loading: true });
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
            isCreatedByMe,
            isChecked: false
          };
          inboxEmailsData.push(currentObject);
        });
        dispatch({
          type: 'initialize',
          data: currentTab === tabs.Inbox ? inboxEmailsData : sentEmails,
          count: currentTab === tabs.Inbox ? inboxEmailsData.length : sentEmails.length
        });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const handleChangeFilter = (e) => {
    if (page !== 0) dispatch({ type: 'pageChange', page: 0 });
    dispatch({ type: 'search', search: e.target.value });
  };

  const getToEmailList = (toList) => {
    return (currentTab === tabs.Sent ? 'To: ' : '') + toList.map((email) => (email === user?.user?.email ? 'me' : email)).join(', ');
  };

  const transform = (node, index) => {
    if (node.type === 'tag' && ['h2', 'h1', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'del', 'img'].indexOf(node.name) >= 0) {
      node.name = 'p';
      return convertNodeToElement(node, index, transform);
    }
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
            message: data.message
          });
          dispatch({ type: 'selection', selectedRecords: [] });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          setDeleteRecord(null);
          fetchData();
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

  const handleCloseViewEmail = () => {
    setEmailId(null);
    setOpenViewEmail(false);
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            showConfirmBox(null);
          }}
        >
          {`Delete (${selectedRecords?.length})`}
        </MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.activityEmail.title }]} />
      </div>
      <CustomContainer>
        {filter && (
          <ListingPageHeader
            leftSideContents={
              <LeftSideContents
                {...{
                  resourceOptions,
                  resource,
                  setResource,
                  setFilter,
                  resourceData,
                  loadingResources,
                  selectedResourceData,
                  setSelectedResourceData
                }}
              />
            }
            searchValue={search}
            onSearch={handleChangeFilter}
            isActionButtonVisible={permissions.email?.isDelete}
            actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
            actionMenuItems={<ActionMenuItems />}
            addButtonOnclick={() => {
              setOpen(true);
            }}
            isAddButtonVisible={true}
            setQueryString
          />
        )}
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={false}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
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
            onClose={(e, reason) => {
              if (reason !== 'backdropClick') {
                handleClose();
                setFullScreen(false);
              }
            }}
            fullWidth
          >
            <CreateEmail
              emailId={emailId}
              handleClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              fetchData={fetchData}
              relatedTo={[
                {
                  type: resource && selectedResourceData ? resource.optionValue : 'user',
                  referenceId: resource && selectedResourceData ? selectedResourceData.optionValue : user?.user?._id,
                  access: true
                }
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

        {openViewEmail ? (
          <Dialog
            open={openViewEmail}
            fullScreen={fullScreenViewEmail || isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            maxWidth="md"
            onClose={(e, reason) => {
              if (reason !== 'backdropClick') {
                handleCloseViewEmail();
              }
            }}
            fullWidth
          >
            <ViewEmail
              emailId={emailId}
              handleClose={() => {
                handleCloseViewEmail();
              }}
              fetchData={fetchData}
              relatedTo={[
                {
                  type: resource && selectedResourceData ? resource.optionValue : 'user',
                  referenceId: resource && selectedResourceData ? selectedResourceData.optionValue : user?.user?._id,
                  access: true
                }
              ]}
              options={emailUsersOptions}
              isMinimized={!fullScreenViewEmail}
              onMinimizeMaximize={() => {
                setFullScreenViewEmail((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            />
          </Dialog>
        ) : null}
      </CustomContainer>
    </section>
  );
};

export default Email;

const LeftSideContents = ({
  resourceOptions,
  resource,
  setResource,
  setFilter,
  resourceData,
  loadingResources,
  selectedResourceData,
  setSelectedResourceData
}) => {
  return (
    <>
      <Autocomplete
        fullWidth
        options={resourceOptions}
        getOptionLabel={(option) => option.optionLabel}
        value={resource}
        className={`sm:max-w-[250px] sm:min-w-[200px] flex-grow`}
        onChange={(event, newValue) => {
          setResource(newValue);
          if (newValue) {
            //setFilter((prevState) => [...prevState, { type: newValue?.optionValue, name: newValue?.optionLabel, isAll: true }]);
          } else {
            setFilter([]);
          }
        }}
        size="small"
        renderInput={(params) => (
          <TextField
            {...params}
            className={`sm:max-w-[250px] sm:min-w-[200px] flex-grow`}
            margin="none"
            size="small"
            label="Select Resource"
            variant="outlined"
          />
        )}
      />
      {resource && resourceData && (
        <Autocomplete
          fullWidth
          disabled={loadingResources}
          options={resourceData}
          getOptionLabel={(option: any) => option.optionLabel}
          getOptionSelected={(option: any, value: any) => option.optionLabel === value.optionLabel}
          className={`sm:max-w-[270px] sm:min-w-[250px] flex-grow`}
          value={selectedResourceData}
          onChange={(event, newValue) => {
            setSelectedResourceData(newValue);
            if (newValue?.optionValue) {
              setFilter((prevState) => [...prevState, { _id: newValue.optionValue, type: resource.optionValue, name: newValue.optionLabel }]);
            } else {
              setFilter([]);
            }
          }}
          size="small"
          renderInput={(params) => (
            <TextField
              {...params}
              className={`sm:max-w-[270px] sm:min-w-[250px] flex-grow`}
              margin="none"
              size="small"
              label={`Select ${resource.optionLabel}`}
              variant="outlined"
            />
          )}
        />
      )}
    </>
  );
};
