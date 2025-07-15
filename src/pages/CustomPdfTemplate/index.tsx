import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { gridLoadingTimeout, prepareDataForGrid, customPdfTemplate, sidebarResource } from '../../constants/helpers';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import routes from '../../components/Helpers/Routes';
import axios, { CancelTokenSource } from 'axios';

const CustomPdfTemplate = () => {
  const renderedFrom = camelCase(sidebarResource?.customPdfTemplate);
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [renderCount, setRenderCount] = useState(0);
  const [columns, setColumns] = useState(null);
  const { api } = customPdfTemplate;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (renderCount > 0) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else setRenderCount((preCount) => preCount + 1);
  }, [search, page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    const columns = [
      {
        accessor: 'name',
        Header: 'Name',
        width: 120,
        disabled: true,
        Cell: ({ row }) => (
          <div>
            <Link className="link" to={`${routes.customPdfTemplateDetail.path}/${row?.original?._id}`} title={row?.original?.name}>
              {row?.original?.name}
            </Link>
          </div>
        )
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 120,
        disabled: true,
        Cell: ({ row }) => <p className="text-truncate">{row.original.type}</p>
      },
      ...getStaticFields(),
      {
        accessor: 'action',
        Header: 'Actions',
        width: 120,
        sticky: 'right',
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        Cell: ({ row }) => (
          <>
            <HtmlTooltip title={permissions?.customPdfTemplate?.isCreate ? 'Clone' : cloneDisable}>
              <span>
                <IconButton
                  size="small"
                  aria-label="Clone"
                  disabled={permissions?.customPdfTemplate?.isCreate ? false : true}
                  onClick={() => {
                    CreateNew(row?.original?.id, true);
                  }}
                >
                  <FileCopyIcon fontSize="small" color={permissions?.customPdfTemplate?.isCreate ? 'primary' : 'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>
            <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
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
                  <DeleteIcon fontSize='small' color={row?.original?.canDelete ? 'error' : 'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          </>
        )
      }
    ];
    setColumns(columns);
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${api}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.customPdfTemplate?.isUpdate;
          finalObject['canDelete'] = permissions?.customPdfTemplate.isDelete && user?.user?._id === finalObject['owner'];
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
      .put(`${api}/remove`, { ids: ids })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const CreateNew = (id, isClone) => {
    if (isClone) {
      history.push(routes.customPdfTemplateDetail.path + '/' + id, { isClone: true });
    } else {
      history.push(routes.customPdfTemplateDetail.path + '/0', { isClone: false });
    }
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={!((selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) === selectedRecords?.length)}
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
        <CustomBreadCrumbs routes={[{ ...routes.customPdfTemplate, title: resources?.customPdfTemplate?.titleSingular }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={permissions?.customPdfTemplate?.isDelete}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => CreateNew('0', false)}
          isAddButtonVisible={permissions?.customPdfTemplate?.isCreate}
        />
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
            isClientSideGrid={true}
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
          message={`Are you sure you want to delete ${deleteRecord ? `${deleteRecord?.name || ''}` : `selected records`} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={handleDelete}
        />
      )}
    </section>
  );
};

export default CustomPdfTemplate;
