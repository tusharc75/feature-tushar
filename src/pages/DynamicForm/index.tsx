import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import axios, { CancelTokenSource } from 'axios';
import { camelCase, startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { getResourceLabel, gridLoadingTimeout, HIDDEN_FIELD_TYPE, prepareDataForGrid } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import ManageDynamicForm from './ManageDynamicForm';

const DynamicForm = () => {
  const { route } = useParams();

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const resource = startCase(route?.replace(/-/g, ' '));
  const renderedFrom = camelCase(resource);
  const resourceLabel = getResourceLabel(resource, user);

  const resourcePath = `/${route}`;
  const detailPagePath = `/${route}/detail`;

  const DynamicFormType = [
    {
      key: `My ${resource}`,
      value: 1
    },
    {
      key: `All ${resource}`,
      value: 2
    }
  ];

  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState(1);
  const [showToggleButtons, setShowToggleButtons] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [search, page, limit, filters, sorting, selectedEntity, selectedType, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${resource}`);
    data = response?.data?.data?.filter((d) => !HIDDEN_FIELD_TYPE.includes(d?.fieldData?.type));
    const newColumns = generateColumns(renderedFrom, data, detailPagePath, true);
    if (newColumns?.some((ele) => ele.accessor === 'owner')) {
      setShowToggleButtons(true);
    }
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
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
      <>
        {permissions[renderedFrom]?.isCreate ? (
          <HtmlTooltip title="Clone">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
        ) : (
          <HtmlTooltip className="cursor-stop" title="You do not have permission to clone/create">
            <IconButton aria-label="Clone" size="small">
              <FileCopyIcon fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        )}
        {permissions[renderedFrom]?.isDelete && (
          <HtmlTooltip title="Delete">
            <IconButton
              size="small"
              aria-label="Delete"
              onClick={() => {
                setDeleteRecord(row.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon color="error" />
            </IconButton>
          </HtmlTooltip>
        )}
      </>
    )
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    if (showToggleButtons && selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
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

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`dynamic-form/${queryString}`, {
        headers: {
          Resource: resource
        },
        cancelToken: cancelTokenSource?.token
      })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions[renderedFrom]?.isUpdate;
          finalObject['canDelete'] = permissions[renderedFrom]?.isDelete;
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

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const values: any = { _id: updatedData?._id };
    Object.keys(inputField)?.map((_key) => {
      values[_key] = updatedData[_key] ? updatedData[_key] : '';
    });
    axiosInstance()
      .put(`/dynamic-form/update-selected-field`, values, {
        headers: {
          Resource: resource
        }
      })
      .then(({ data }) => {
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
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
      .put(
        `dynamic-form/remove`,
        { ids: ids },
        {
          headers: {
            Resource: resource
          }
        }
      )
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

  const ActionMenuItems = () => {
    return (
      <MenuItem
        onClick={() => {
          setShowDeleteConfirmBox(true);
        }}
      >
        {`Delete (${selectedRecords?.length})`}
      </MenuItem>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: resourceLabel, path: `/${route}` }]} />
        <ImportExportLinks
          permissions={permissions[renderedFrom]}
          module={renderedFrom}
          api={'dynamic-form'}
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
          headers={{
            Resource: resource
          }}
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          toggleButtonList={showToggleButtons ? DynamicFormType : null}
          onToggle={onTypeChange}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={permissions[renderedFrom]?.isDelete}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => {
            setShowManageDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={permissions[renderedFrom]?.isCreate}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            onSaveEdit={onSaveInlineEdit}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={resource}
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
          message={`Are you sure you want to delete the ${resource?.toLowerCase()} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={handleDelete}
        />
      )}
      {showManageDialog.open && (
        <ManageDynamicForm
          resource={resource}
          resourcePath={resourcePath}
          isClone={showManageDialog.isClone}
          id={showManageDialog.idToClone}
          onClose={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            setShowManageDialog({ open: false, isClone: false, idToClone: null });
            fetchData();
          }}
        />
      )}
    </section>
  );
};

export default DynamicForm;
