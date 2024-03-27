import { Box, IconButton } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, useColumns } from 'src/components/CustomReactTable';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { findOne, objectStore } from 'src/constants/indexdbhelper';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

export default function FieldTicketTable({ renderedFrom, ActionsRenderer = null, setOpenDialog, fetchData, state, dispatch, height, isOffline }) {
  const toastConfig = useContext(CustomToastContext);

  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.resource, objectStore.fieldTicket);
      } else {
        const response = await axiosInstance().get(`/field?resource=${sidebarResource.fieldTicket}`);
        data = response?.data?.data;
      }
      const newColumns = generateColumns(routes.fieldTicket?.title, data, routes.fieldTicketDetail.path);
      newColumns?.forEach((o) => {
        if (o.accessor === 'fieldTicketNumber') {
          o.cell = ({ row }) =>
            row?.original?.fieldTicketNumber ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <h5
                  className="link text-truncate"
                  onClick={() => {
                    setOpenDialog({ open: true, isClone: false, id: row?.original?._id });
                  }}
                >
                  {row?.original?.fieldTicketNumber}
                </h5>
                <Box ml={1}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.fieldTicketDetail.path}/${row?.original?._id}`);
                    }}
                  >
                    <OpenInNewIcon fontSize="small" color="primary" />
                  </IconButton>
                </Box>
              </div>
            ) : (
              <NoDataCell />
            );
        }
      });
      if (ActionsRenderer) {
        setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
      } else {
        setColumns([...newColumns, ...getStaticFields()]);
      }
    } catch (e) {
      toastConfig.setToastConfig(e);
    }
  };

  return (
    <>
      {columns ? (
        <CustomReactTable
          height={height}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          isClientSideGrid={true}
          hideAction={ActionsRenderer ? false : true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
}
