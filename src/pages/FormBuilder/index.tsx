import { Box, Button } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import { gridLoadingTimeout } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ArrangeView from './ArrangeView';

const FormBuilder = () => {
  const renderedFrom = 'form-builder';
  const toastConfig = useContext(CustomToastContext);
  const [arrangeViewOpen, setArrangeViewOpen] = useState(false);
  const [resource, setResource] = useState([]);
  const [columns, setColumns] = useState([]);
  const { state, dispatch } = useTableReducer();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    const columns = [
      {
        accessor: 'resourceLabel',
        Header: 'Resource Label',
        width: 120,
        Cell: ({ row }) => (
          <div>
            <Link className="text-truncate link" to={'/form-builder/' + row?.original?.resource}>
              {row?.original?.resourceLabel || row?.original?.resource}
            </Link>
          </div>
        )
      },
      {
        accessor: 'homePageLabel',
        Header: 'Home Page Label',
        width: 120,
        Cell: ({ row }) => (row?.original?.homePageLabel ? <p className="text-truncate">{row?.original?.homePageLabel}</p> : <NoDataCell />)
      },
      {
        accessor: 'section',
        Header: 'Section',
        width: 120,
        Cell: ({ row }) => (row?.original?.section ? <p className="text-truncate">{row?.original?.section}</p> : <NoDataCell />)
      },
      {
        accessor: 'resource',
        Header: 'Resource',
        width: 120,
        Cell: ({ row }) => (row?.original?.resource ? <p className="text-truncate">{row?.original?.resource}</p> : <NoDataCell />)
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

  const RightSideContents = () => {
    return (
      <>
        <Button
          variant="outlined"
          className={'btn-outline-v1'}
          onClick={() => {
            setArrangeViewOpen(true);
          }}
        >
          Change Resource Order
        </Button>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.formBuilder]} />
      </div>
      <CustomContainer>
        <ListingPageHeader rightSideContents={<RightSideContents />} isActionButtonVisible={false} isAddButtonVisible={false} />
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
