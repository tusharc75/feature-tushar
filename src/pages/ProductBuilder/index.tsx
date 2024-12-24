import { Box, MenuItem } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { camelCase } from 'lodash';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import routes from '../../components/Helpers/Routes';
import { dateFormat, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import CreateNewDialog from './CreateNewDialog';
import axios, { CancelTokenSource } from 'axios';

const ProductBuilder = () => {
  const renderedFrom = camelCase(sidebarResource.productBuilder);
  const {
    state: {
      permissions: { productBuilder: permission },
      user: { user },
      resources
    }
  } = useData();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [isCreate, setIsCreate] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [okButtonLoading] = useState(false);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const columns = [
    {
      accessor: 'name',
      Header: 'Name',
      show: true,
      disabled: true,
      Cell: ({ row }) => (
        <Link className="link" to={`${routes.productBuilder.path}/${row?.original?.id}`}>
          {row?.original?.name}
        </Link>
      )
    },
    {
      accessor: 'createdBy',
      Header: 'Created By',
      show: true,
      sortable: false,
      Cell: ({ row }) =>
        row.original?.createdByDate ? (
          <h5 className="createBy" title={`${row.original?.createdByDate} • ${moment(row.original?.createdByDate).format(dateFormat)}`}>
            {row.original?.createdByDate}
            <span className="hidden">&nbsp;-&nbsp;</span>
            <span className="createdAtTime badge-date">{moment(row.original?.createdByDate)?.format(dateFormat)}</span>
          </h5>
        ) : (
          <NoDataCell />
        )
    }
  ];
  //  Grid Variables - End

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchProductBuilder(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, []);

  // useEffect(() => {
  //   fetchProductBuilder();
  // }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]); //Need to uncomment this after api got fixed

  const NameRenderer = (params) => (
    <Link className="link" to={`${routes.productBuilder.path}/${params.data.id}`}>
      {params.data.name}
    </Link>
  );

  const ActionsRenderer = (params) => {
    const hasPermission = permission?.isDelete;
    return (
      <span title={hasPermission ? '' : "You don't have permission to delete"}>
        <IconButton
          disabled={hasPermission ? false : true}
          size="small"
          aria-label="Delete"
          onClick={() => {
            setDeleteRecord(params.data);
            setShowDeleteConfirmBox(true);
          }}
        >
          <DeleteIcon color={hasPermission ? 'error' : 'disabled'} />
        </IconButton>
      </span>
    );
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

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
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchProductBuilder = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });

    const queryString = getQueryString();
    axiosInstance()
      .get(`/productbuilder${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permission.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permission.isUpdate;
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: data.length });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const handleDelete = () => {
    if (deleteRecord) {
      axiosInstance()
        .delete(`/productbuilder/` + deleteRecord._id)
        .then(() => {
          fetchProductBuilder();
          setShowDeleteConfirmBox(false);
          setDeleteRecord(null);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .put(
          `/productbuilder/remove`,
          selectedRecords.map((d) => d._id)
        )
        .then(() => {
          fetchProductBuilder();
          setShowDeleteConfirmBox(false);
          setDeleteRecord(null);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords?.every((e) => !e.canDelete) ? true : false}
          onClick={() => {
            if (selectedRecords.length === 1) {
              setDeleteRecord(selectedRecords[0]);
            } else {
              setDeleteRecord(null);
            }
            setShowDeleteConfirmBox(true);
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
        <CustomBreadCrumbs routes={[{ title: resources?.productBuilder?.titlePlural }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          isActionButtonVisible={permission?.isDelete}
          actionButtonProps={{ disabled: selectedRecords.length > 0 ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => setIsCreate(true)}
          isAddButtonVisible={permission?.isCreate}
        />

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchProductBuilder}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.productBuilder}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${
              deleteRecord
                ? `${resources?.productBuilder?.titleSingular?.toLowerCase()} :
              ${deleteRecord?.name || ''}`
                : `selected ${resources?.productBuilder?.titlePlural?.toLowerCase()}`
            } ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
            okBtnLoading={okButtonLoading}
          />
        )}
        {isCreate && <CreateNewDialog handleClose={() => setIsCreate(false)} />}
      </CustomContainer>
    </section>
  );
};

export default ProductBuilder;
