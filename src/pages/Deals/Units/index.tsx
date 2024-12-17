import { Box } from '@material-ui/core';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import { prepareDataForGrid, sidebarResource } from '../../../constants/helpers';

const Units = ({ dealData }) => {
  const renderedFrom = camelCase(`${sidebarResource.deals}_assets`);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.units}`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(renderedFrom, data, routes.unitDetail.path);
        setColumns([...newColumns, ...getStaticFields()]);
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    if (dealData?.units?.length) {
      dispatch({ type: 'loading', loading: true });
      axiosInstance()
        .get(`${routes.units.path}?getById=${encodeURIComponent(JSON.stringify(dealData?.units))}`)
        .then(({ data: { data } }) => {
          let rows = data?.map((u, i) => {
            let finalObject: any = prepareDataForGrid(u, user);
            return finalObject;
          });
          dispatch({ type: 'initialize', data: rows, count: rows?.length });
          dispatch({ type: 'loading', loading: false });
        })
        .catch((err) => {
          dispatch({ type: 'loading', loading: false });
          toastConfig.setToastConfig(err);
        });
    } else {
      dispatch({ type: 'initialize', data: [], count: 0 });
    }
  };

  return (
    <Fragment>
      {columns ? (
        <Box zIndex={5}>
          <CustomReactTable
            height={'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchData}
            hideSelection={true}
            hideAction={true}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Fragment>
  );
};

export default Units;
