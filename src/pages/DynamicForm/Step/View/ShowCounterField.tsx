import { Box } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import EditableExcelTable from 'src/components/EditableExcelTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const ShowCounterField = ({ fields, resource, selectedRow }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(resource);

  const {
    state: { user }
  }: any = useData();

  const [columns, setColumns] = useState(null);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchColumn();
  }, []);

  const fetchColumn = () => {
    setColumns(null);
    const newColumns = generateColumns(renderedFrom, fields);
    setColumns(newColumns);
  };

  useEffect(() => {
    fetchData();
  }, [selectedRow]);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`dynamic-form/counter/${selectedRow?._id}`, {
        headers: {
          Resource: resource
        }
      })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u, i) => {
          let finalObject = prepareDataForGrid(u, user);
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows.reverse(), count: count });
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

  const handleUpdate = (rows) => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .put(`/dynamic-form/counter/${selectedRow?._id}`, rows, {
        headers: {
          Resource: resource
        }
      })
      .then(({ data }) => {
        fetchData();
      })
      .catch((error) => {
        fetchData();
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (row) => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .put(
        `/dynamic-form/counter/${selectedRow?._id}/remove`,
        { ids: [row?._id] },
        {
          headers: {
            Resource: resource
          }
        }
      )
      .then(({ data }) => {
        fetchData();
      })
      .catch((error) => {
        fetchData();
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      {columns ? (
        <div className="p-2">
          <EditableExcelTable
            columns={columns}
            data={state.dataRows}
            onChange={(rows) => handleUpdate(rows)}
            onDelete={(row) => handleDelete(row)}
          />
        </div>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
};

export default ShowCounterField;
