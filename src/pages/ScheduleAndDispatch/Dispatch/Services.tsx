import { Box, IconButton } from '@material-ui/core';
import { camelCase, startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { fetch_rental_product_fields } from '../../../components/RentalManagment/helper';
import { MATERIAL_TYPE, rentalManagement, sidebarResource } from '../../../constants/helpers';
import { FiExternalLink } from 'react-icons/fi';

const Services = ({ rentalManagementData }) => {
  const renderedFrom = `${camelCase(sidebarResource.scheduleAndDispatch)}_${camelCase(sidebarResource.rentalManagement)}_service`;
  const toastConfig = useContext(CustomToastContext);

  const [columns, setColumns] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
    fetchData();
  }, [rentalManagementData]);

  const fetchFields = async () => {
    var data = await fetch_rental_product_fields(rentalManagementData?.currency, false);
    data = [...data]?.filter((f) => f?.isRead);
    const newColumns = generateColumns(
      renderedFrom,
      data?.map((e) => {
        return { ...e, fieldName: e.fieldName === 'qty' ? 'qtyDisplay' : e.fieldName };
      }),
      null,
      false,
      rentalManagementData?.currency
    );
    let column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile || isTablet ? 'none' : 'left',
        disableFilters: true,
        disabled: true,
        width: 200,
        Cell: ({ row }) =>
          row.original['type'] ? (
            <p>
              {`${startCase(row.original?.type)} `}
              {row?.original?.serviceDetail?.serviceType ? `(${row?.original?.serviceDetail?.serviceType})` : ''}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-1">
            <p> {row.original.detail}</p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      }
    ];
    column = [...column, ...newColumns];
    setColumns(column);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    try {
      var data: any = [];

      const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
      data = response?.data?.data;

      let rows = data.material.filter((e) => e.parentId === null);
      rows = rows.filter((e) => e.type === MATERIAL_TYPE.service);

      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.detail = parent?.serviceDetail?.serviceName;
        parent.description = parent?.serviceDetail?.serviceDescription || '';
        parent.qtyDisplay = parent.qty;
      });

      dispatch({ type: 'initialize', data: rows, count: rows?.length });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <Fragment>
      {columns ? (
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
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Fragment>
  );
};

export default Services;
