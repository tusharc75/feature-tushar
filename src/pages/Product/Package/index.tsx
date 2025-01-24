import { useState, useEffect, useContext } from 'react';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import { Box } from '@mui/material';
import CustomReactTable, { useColumns, getStaticFields, useTableReducer } from 'src/components/CustomReactTable';
import { gridLoadingTimeout, prepareDataForGrid } from '../../../constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';

const Package = ({ renderedFrom, productId }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });

  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);
  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      dispatch({ type: 'selection', selectedRecords: [] });
      dispatch({ type: 'loading', loading: true });

      let data;
      const response = await axiosInstance().get(`/product/${productId}/package/product-package`);
      data = response?.data?.data;
      let rows = data.map((u) => {
        let res = {
          ...prepareDataForGrid(u, user)
        };
        return res;
      });
      dispatch({ type: 'initialize', data: rows, count: rows.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      toastConfig.setToastConfig(error);
      dispatch({ type: 'loading', loading: false });
    }
  };

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Packages&view=true')
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(renderedFrom, data, routes.packagesDetail.path, true);
        setColumns([...newColumns, ...getStaticFields()]);
      });
  };

  return (
    <Box mt={2}>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 150px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          isClientSideGrid={true}
          hideSelection={true}
          hideAction={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Box>
  );
};

export default Package;
