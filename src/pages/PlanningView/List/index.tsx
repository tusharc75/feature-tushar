import { useEffect, useState, useContext } from 'react';
import { TextField, Box } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { Autocomplete } from '@material-ui/lab';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import CustomReactTable, { useColumns, getStaticFields, gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

function ListView({ resourceList, selectedResource, setSelectedResource, setQueryString }) {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, selectedEntity }
  }: any = useData();
  const { generateColumns } = useColumns();

  const [renderedFrom, setRenderedFrom] = useState('');
  const [columns, setColumns] = useState(null);

  const { state, dispatch } = useTableReducer({ renderedFrom });

  const { page, limit, filters, sorting, search } = state;

  const fetchGridColumns = async () => {
    axiosInstance()
      .get(`/field?resource=${selectedResource.resource}`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(renderedFrom, data, selectedResource.path);
        setColumns([...newColumns, ...getStaticFields()]);
      });
  };

  useEffect(() => {
    if (selectedResource) {
      setRenderedFrom(`${routes[selectedResource.key].title}`);
      fetchGridColumns();
    } else {
      setColumns(null);
    }
  }, [selectedResource]);

  useEffect(() => {
    if (selectedResource) {
      fetchData();
    }
  }, [selectedResource, page, filters, limit, sorting, search]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;
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

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    setQueryString(queryString);
    try {
      let data: any = [],
        count;
      const response: any = await axiosInstance().get(`${routes[selectedResource.key].path}${queryString}`);
      data = response?.data?.data?.data ? response?.data?.data?.data : response?.data?.data;
      count = response?.data?.data?.count ? response?.data?.data?.count : response?.data?.count;
      let rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <>
      <div className="flex max-[560px]:pt-[40px] min-[561px]:pr-[100px]">
        <Autocomplete
          options={resourceList}
          getOptionLabel={(option) => (option && option?.title) || ''}
          style={{ width: '350px' }}
          value={selectedResource}
          onChange={(event, newValue) => {
            setSelectedResource(newValue);
          }}
          size="small"
          renderInput={(params) => <TextField {...params} label="Select Resource" size="small" variant="outlined" />}
        />
      </div>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 300px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          hideSelection={true}
          hideAction={true}
          showFilters={true}
          resource={selectedResource?.resource}
        />
      ) : selectedResource ? (
        <Box height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      ) : (
        <Box mt={2}>
          <span>Please Select Resource</span>
        </Box>
      )}
    </>
  );
}

export default ListView;
