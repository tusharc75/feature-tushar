import { Box, IconButton } from '@material-ui/core';
import { camelCase, startCase } from 'lodash';
import { Fragment, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { CHILD_RESOURCE, MATERIAL_TYPE, prepareDataForGrid, sidebarResource } from '../../../constants/helpers';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';

const Material = ({ dealId }) => {
  const renderedFrom = camelCase(`${sidebarResource.deals}_material`);
  const {
    state: { user }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
    fetchData();
  }, []);

  const fetchFields = async () => {
    const response = await fetch_child_resource_fields(CHILD_RESOURCE.dealsMaterial, user.user?.brandCurrency, true);
    const newColumns = generateColumns(renderedFrom, response, routes.dealDetail.path, true);
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
        disableFilters: true,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        width: 200,
        Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            <p className="link text-truncate" title={row.original.detail}>
              {row.original.detail}
            </p>
            <IconButton
              size="small"
              onClick={() => {
                if (row.original.type === MATERIAL_TYPE.product) {
                  window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                }
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      }
    ];
    setColumns([...column, ...newColumns]);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    const response = await axiosInstance().get(`${routes.deals.path}/material/${dealId}`);
    let rows = response?.data?.data?.map((u, i) => {
      let finalObject: any = prepareDataForGrid(u, user);
      return {
        ...finalObject,
        index: i + 1,
        detail: u?.productDetail[0]?.productName || '',
        materialId: u?.productDetail[0]?._id
      };
    });
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
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

export default Material;
