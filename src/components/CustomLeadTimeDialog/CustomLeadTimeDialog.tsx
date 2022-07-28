import { useContext, useEffect, useReducer } from 'react';
import { Box, Button, CircularProgress, Dialog, Grid } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import routes from '../Helpers/Routes';
import CustomSwipableList from '../SwipableListComponents/CustomSwipableList';
import { useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import CustomAgGrid from '../AgGridComponents/CustomAgGrid';
import { useState } from 'react';
import useColumns, { checkStaticField, getFrameworkComponents, getStaticFields } from '../../constants/useColumns';
import { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import { getLocalStorageArrayData, gridLoadingTimeout, isObjectEmpty, leadTimeMaster, prepareDataForGrid } from 'src/constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import SearchBox from '../Helpers/SearchBox';
import { MdAdd } from 'react-icons/md';
import { AddOutlined } from '@material-ui/icons';
import styles from '../../pages/Leads/Header.module.scss';

export default function CustomDialogComponent({ title, onClose, handleAddLeadTime, productId, isAssigning }) {
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = 'assignLeadTimeMaster';
  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;

  const { getColumnData } = useColumns();
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  useEffect(() => {
    fetchGridColumns();
    fetchData();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${leadTimeMaster.resource}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(routes.repairType?.title, o?.fieldData, routes.repairTypeDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    axiosInstance()
      .get(`${leadTimeMaster.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.repairType?.isUpdate;
          finalObject['canDelete'] = permissions?.repairType?.isDelete;
          let res = {
            ...finalObject
          };
          return res;
        });
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
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

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
  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    let filterById = [];
    if (filterById.length > 0) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`;
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
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
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
  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };
  const handleAssignProduct = async () => {
    handleAddLeadTime(selectedRecords[0]?._id);
  };

  return (
    <Dialog disableBackdropClick={true} maxWidth="md" open onClose={onClose} aria-labelledby="form-dialog-title" fullScreen={true} fullWidth>
      {title && <CustomDialogHeader title={title} onClose={onClose}></CustomDialogHeader>}

      <CustomDialogContent>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={6} className="d-flex align-items-center gap-1"></Grid>
            <Grid item xs={6} className={styles.filter_side}>
              <Box className={styles.filter_side_header} component="div">
                <SearchBox onSearch={handleSearch} searchbox={styles.search_box_input} width="242px" size="small" value={search} />
                <Button
                  disabled={
                    isAssigning ||
                    [...getLocalStorageArrayData(localStorageSelectedRecords)].length === 0 ||
                    [...getLocalStorageArrayData(localStorageSelectedRecords)].length > 1
                  }
                  onClick={handleAssignProduct}
                  color="primary"
                  size="small"
                  variant="contained"
                  endIcon={isAssigning && <CircularProgress color="inherit" size={18} />}
                >
                  Add
                </Button>
              </Box>
            </Grid>
          </Grid>
        </div>
        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions.repairType}
            primaryField={columns?.find((d) => d.primaryField)}
            onClick={(data) => {
              history.push(`${routes.repairTypeDetail.path}/${data._id}`);
            }}
            dataRows={dataRows}
            selectedRecords={getLocalStorageArrayData(`${localStorageSelectedRecords}`)}
            dispatch={dispatch}
            onEdit={(data) => {
              history.push(`${routes.repairTypeDetail.path}/${data._id}?openEdit=true`);
            }}
            extraParamsToCheckDelete={true}
            onDelete={(data) => {}}
            rowCount={rowCount}
            page={page}
            loading={loading}
            additionalDetails={[]}
            chips={[]}
            onCreate={false}
            showClone={false}
            onClone={(data) => {}}
            renderedFrom={renderedFrom}
          />
        ) : Object.keys(frameWorkComponent).length > 0 ? (
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
            actionWidth={150}
            loading={loading}
            renderedFrom={renderedFrom}
            allowAction={false}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
          />
        ) : null}
      </CustomDialogContent>

      <CustomDialogFooter>
        <Button variant="outlined" color="primary" size="small" onClick={onClose}>
          Close
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
}
