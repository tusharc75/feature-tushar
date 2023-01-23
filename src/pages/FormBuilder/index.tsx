import React, { useEffect, useState, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import { Link } from 'react-router-dom';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomContainer from '../../components/CustomContainer';
import { FaWpforms } from 'react-icons/fa';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import { gridLoadingTimeout } from '../../constants/helpers';
import { useHistory } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { CommonRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import { Box, Button } from '@material-ui/core';
import styles from './Header.module.scss';
import ArrangeView from './ArrangeView';

const FormBuilder = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;
  const [arrangeViewOpen, setArrangeViewOpen] = useState(false);
  const [resource, setResource] = useState([]);

  const columns = [
    { field: 'resourceLabel', headerName: 'Resource Label', show: true, disabled: true, cellRenderer: 'resourceRenderer' },
    { field: 'homePageLabel', headerName: 'Home Page Label', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'resource', headerName: 'Resource', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    {
      field: 'section',
      headerName: 'Section',
      show: true,
      disabled: true
    }
  ];

  const ResourceRenderer = (params) => (
    <Link className="link" to={'/form-builder/' + params.data.resource}>
      {params.data.resourceLabel}
    </Link>
  );

  useEffect(() => {
    fetchGetBrandResource();
  }, []);

  const frameworkComponents = {
    commonRenderer: CommonRenderer,
    resourceRenderer: ResourceRenderer
  };
  const closeHandler = () => {
    setArrangeViewOpen(false);
    fetchGetBrandResource();
  };

  const fetchGetBrandResource = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`/sa-formbuilder/resource?allResource=true`)
      .then(({ data: { data } }) => {
        data.forEach((d) => {
          d['_id'] = d.id;
        });
        setResource(data);
        dispatch({ type: 'initialize', data: data, count: data.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={12} sm={12} xs={12}>
          <CustomBreadCrumbs routes={[routes.formBuilder]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <Grid className={styles.filter_side_container} container>
          <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
          </Grid>
          <Grid item md={6} sm={12} xs={12} className={styles.filter_side}>
            <Grid style={{ display: 'flex', gap: '5px' }}>
              <Button
                variant="outlined"
                size="small"
                className={'btn-outline-v1'}
                onClick={() => {
                  setArrangeViewOpen(true);
                }}
              >
                Arrange View
              </Button>
            </Grid>
          </Grid>
        </Grid>
        {arrangeViewOpen && <ArrangeView open={arrangeViewOpen} close={closeHandler} resourceData={resource} />}
        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={false}
            allowSwipe={false}
            permissions={null}
            primaryField={columns?.find((d) => d.field === 'resource')}
            onClick={(d) => {
              history.push(`${routes.formBuilder.path}/${d.resource}`);
            }}
            dataRows={dataRows}
            selectedRecords={[]}
            dispatch={dispatch}
            onEdit={(d) => { }}
            extraParamsToCheckDelete={true}
            onDelete={(d) => { }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            additionalDetails={[]}
            chips={[]}
            owerCollaboratorInitialsOrImages=""
            onCreate={() => { }}
            showClone={false}
            onClone={() => { }}
            renderedFrom={'form-builder'}
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
            allowAction={false}
            allowSelection={false}
            isClientSideGrid={true}
            loading={loading}
            refreshGrid={fetchGetBrandResource}
            renderedFrom={routes.formBuilder.title}
          />
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default FormBuilder;
