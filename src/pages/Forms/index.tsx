import { Box, Tab, Tabs } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import CustomContainer from 'src/components/CustomContainer';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import axiosInstance from 'src/axios/axiosInstance';
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { useData } from 'src/StateProvider/Provider';

const Forms = () => {
  const renderedFrom = 'forms';
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { page, limit, search, filters, sorting } = state;

  const columns = [
    {
      accessor: 'formName',
      Header: 'Form Name',
      Cell: ({ row }) => (
        <div>
          {row?.original?.formName ? (
            <Link className="text-truncate link" to={`${routes.formsDetail.path}/${row?.original?._id}`}>
              {row?.original?.formName}
            </Link>
          ) : (
            <NoDataCell />
          )}
        </div>
      )
    },
    {
      accessor: 'formTitle',
      Header: 'Form Title',
      Cell: ({ row }) => (row?.original?.formTitle ? <p className="text-truncate">{row?.original?.formTitle}</p> : <NoDataCell />)
    },
    {
      accessor: 'formDescription',
      Header: 'Form Description',
      Cell: ({ row }) => (row?.original?.formDescription ? <p className="text-truncate">{row?.original?.formDescription}</p> : <NoDataCell />)
    }
  ];

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, selectedEntity]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });

    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes?.forms.path}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u: any) => {
          let finalObject: any = prepareDataForGrid(u);
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
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
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.forms]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          isAddButtonVisible={true}
          addButtonOnclick={() => {
            history.push(routes.formsDetail.path + '/0');
          }}
        />

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
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

export default Forms;
