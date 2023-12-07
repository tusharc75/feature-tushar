import React, { useEffect, useState, useContext } from 'react';
import Grid from '@material-ui/core/Grid';
import { Link } from 'react-router-dom';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomContainer from '../../components/CustomContainer';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTableNew';
import { gridLoadingTimeout } from '../../constants/helpers';
import { isMobile } from 'react-device-detect';
import { Box, Button } from '@material-ui/core';
import styles from './Header.module.scss';
import ArrangeView from './ArrangeView';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const FormBuilder = () => {
  const renderedFrom = 'form-builder';
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer();
  const { page, limit } = state;
  const [arrangeViewOpen, setArrangeViewOpen] = useState(false);
  const [resource, setResource] = useState([]);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    const columns = [
      {
        accessor: 'resource',
        Header: 'Resource',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) =>
          <div>
            {row?.original?.resource ? (
              <Link className="text-truncate link" to={'/form-builder/' + row?.original?.resource}>
                {row?.original?.resource}
              </Link>
            ) : (
              <NoDataCell />
            )}
          </div>
      },
      {
        accessor: 'resourceLabel',
        Header: 'Resource Label',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row?.original?.resourceLabel ? <p className="text-truncate">{row?.original?.resourceLabel}</p> : <NoDataCell />)
      },

      {
        accessor: 'homePageLabel',
        Header: 'Home Page Label',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row?.original?.homePageLabel ? <p className="text-truncate">{row?.original?.homePageLabel}</p> : <NoDataCell />)
      },
      {
        accessor: 'section',
        Header: 'Section',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (row?.original?.section ? <p className="text-truncate">{row?.original?.section}</p> : <NoDataCell />)
      }
    ];
    setColumns(columns);
  };

  useEffect(() => {
    fetchGetBrandResource();
  }, []);

  const closeHandler = () => {
    setArrangeViewOpen(false);
    fetchGetBrandResource();
  };

  const fetchGetBrandResource = () => {
    dispatch({ type: 'loading', loading: true });
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
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.formBuilder]} />
      </div>
      <CustomContainer>
        <Grid className={styles.filter_side_container} container>
          <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}></Grid>
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
                Change Resource Order
              </Button>
            </Grid>
          </Grid>
        </Grid>
        {arrangeViewOpen && <ArrangeView open={arrangeViewOpen} close={closeHandler} resourceData={resource} />}
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 250px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchGetBrandResource}
            isClientSideGrid={true}
            hideSelection={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
    </section>
  );
};

export default FormBuilder;
