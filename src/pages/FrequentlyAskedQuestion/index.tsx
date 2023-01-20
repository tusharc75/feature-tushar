import { Box, Grid, Button, Menu, MenuItem, Tooltip, IconButton } from '@material-ui/core';
import { useState, useEffect, Fragment, useContext, useReducer } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { Link } from 'react-router-dom';
import CustomContainer from 'src/components/CustomContainer';
import styles from '../Leads/Header.module.scss';
import routes from 'src/components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { FaQuestionCircle } from 'react-icons/fa';
import { useData } from 'src/StateProvider/Provider';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { MdAdd } from 'react-icons/md';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import axiosInstance from 'src/axios/axiosInstance';
import { camelCase } from 'lodash';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import { getLocalStorageArrayData, gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, removeLocalStorage } from 'src/constants/helpers';
import ManageFrequentlyAskedQuestion from './ManageFrequentlyAskedQuestion';
import SearchBox from 'src/components/Helpers/SearchBox';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';

const FrequentlyAskedQuestion = () => {
  const renderedFrom = camelCase(routes?.frequentlyAskedQuestion.title);
  const {
    state: { permissions, selectedEntity }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const { getColumnData } = useColumns();
  const columnState = JSON.parse(localStorage.getItem(renderedFrom));
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState([]);
  const [open, setOpen] = useState({ open: false, isClone: false });
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [clonedData, setClonedData] = useState([]);
  const [freqentlyAskedQuestionId, setFrequentlyAskedQuestionId] = useState(null);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Frequently Asked Question')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          if (['label'].find((d) => d === o?.fieldData?.fieldName)) {
            columns = [
              ...columns,
              {
                disabled: false,
                field: 'label',
                headerName: 'Label',
                pivotIndex: 0,
                show: true,
                cellRenderer: 'nameRenderer',
                primaryField: true
              }
            ];
          } else {
            if (o?.fieldData?.primaryField === true) {
              columns = [
                ...columns,
                { field: o?.fieldData?.fieldName, headerName: o?.fieldData?.fieldLabel, show: true, disabled: true, cellRenderer: 'nameRenderer' }
              ];
            } else {
              let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.frequentlyAskedQuestion.path);

              if (currentColumn !== null) {
                columns = [...columns, currentColumn?.columnData];
                if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                  rendererNames.push(currentColumn?.rendererName);
                }
              }
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          nameRenderer: NameRenderer,
          actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const fetchFrequentlyAskedQuestionData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`/frequently-asked-question${queryString}`)
      .then(({ data: { data } }) => {
        let count = data?.count;
        let rows = data?.data.map((u: any) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.frequentlyAskedQuestion?.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.frequentlyAskedQuestion?.isUpdate;

          return {
            ...finalObject
          };
        });
        setIsAllChecked(false);
        setClonedData(data);
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: count,
            selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
          });
        } else {
          dispatch({
            type: 'initialize',
            data: rows,
            count: count,
            selectedRecords: rows.filter((f) => f.isChecked === true)
          });
        }
        if (gridApi) {
          try {
            let oldSelectedRecords = localStorage.getItem(localStorageSelectedRecords)
              ? JSON.parse(localStorage.getItem(localStorageSelectedRecords))
              : [];
            if (oldSelectedRecords.length > 0) {
              gridApi.forEachNode(function (node) {
                node.setSelected(oldSelectedRecords.some((o) => o === node.data._id));
              });
            }
          } catch (ex) {
            console.error('Error in getting selected records from local storage');
          }
        }
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const NameRenderer = (params) => {
    return (
      <span className=" d-flex gap-2 align-items-center">
        <Link className="link" to={`${routes.frequentlyAskedQuestionDetail.path}/${params.data._id}`}>
          {params.value}
        </Link>
      </span>
    );
  };

  const ActionsRenderer = (params) => (
    <Fragment>
      {permissions?.freqentlyAskedQuestion?.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setFrequentlyAskedQuestionId(params.data.id);
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
      {permissions?.freqentlyAskedQuestion?.isDelete ? (
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
          <IconButton aria-label="Delete" size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Fragment>
  );

  const replaceFieldName = (field) => {
    switch (field) {
      case 'createdBy':
        return 'createdBy.user.concatedName';

      case 'updatedBy':
        return 'updatedBy.user.concatedName';

      default:
        return field;
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldName(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };
  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`/frequently-asked-question/remove`, { ids: ids })
      .then(({ data }) => {
        removeLocalStorage(localStorageSelectedRecords);
        fetchFrequentlyAskedQuestionData();
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
  };

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchFrequentlyAskedQuestionData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: routes.frequentlyAskedQuestion.title }]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={permissions.freqentlyAskedQuestion}
            module="frequentlyAskedQuestion"
            api={'frequently-asked-question'}
            afterImportCompleted={() => {
              fetchFrequentlyAskedQuestionData();
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
              else fetchFrequentlyAskedQuestionData();
            }}
            additionalParams={getQueryString(true)}
          />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
              <div className="d-flex align-items-center">
                <FaQuestionCircle size={20} style={{ paddingBottom: '3px' }} />
                <span className="listingHeader">{routes.frequentlyAskedQuestion.title}</span>
              </div>
            </Grid>
            <Grid md={6} sm={12} xs={12} container className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid>
                  <SearchBox
                    onSearch={handleSearch}
                    searchbox={styles.search_box_input}
                    width={isMobile ? '200px' : '242px'}
                    style={isMobile ? { flex: 1 } : {}}
                    size="small"
                    value={search}
                  />
                </Grid>
                <Grid style={{ display: 'flex', gap: '5px' }}>
                  {permissions?.freqentlyAskedQuestion?.isCreate && (
                    <Button
                      className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                      onClick={() => {
                        setFrequentlyAskedQuestionId(null);
                        setOpen({ open: true, isClone: false });
                      }}
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      size="small"
                      color="primary"
                      startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    >
                      {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                    </Button>
                  )}
                  {permissions?.freqentlyAskedQuestion?.isDelete && (
                    <>
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        color="default"
                        size="small"
                        onClick={openActions}
                        disabled={selectedRecords.length ? false : true}
                        aria-controls="action-menu"
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
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </div>
        {Object.keys(frameWorkComponent).length > 0 ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions.freqentlyAskedQuestion}
              primaryField={columns?.find((d) => d.primaryField)}
              onClick={(data) => {
                setFrequentlyAskedQuestionId(data.id);
                setOpen({ open: true, isClone: false });
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {
                setFrequentlyAskedQuestionId(data.id);
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
                setFrequentlyAskedQuestionId(data.id);
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
              refreshGrid={fetchFrequentlyAskedQuestionData}
              showOnlyShowFilteredRecordSwitch={true}
            />
          )
        ) : null}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${routes?.frequentlyAskedQuestion?.title?.toLowerCase()}  ${deleteRecord?.name || ''} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}

        {open?.open && (
          <ManageFrequentlyAskedQuestion
            id={freqentlyAskedQuestionId}
            isClone={open?.isClone}
            onClose={() => setOpen({ open: false, isClone: false })}
            onSuccess={() => {
              setOpen({ open: false, isClone: false });
              fetchFrequentlyAskedQuestionData();
            }}
          />
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default FrequentlyAskedQuestion;
