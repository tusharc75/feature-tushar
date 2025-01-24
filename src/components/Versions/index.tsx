import { Box, Dialog, IconButton } from '@mui/material';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, fieldTicket } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { startCase } from 'lodash';
import { fetch_child_resource_fields } from '../ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';

function Versions({ id, label, childResource, resource, referenceData, versions, renderedFrom, handleClose }) {
  const [fullScreen, setFullScreen] = useState(true);
  const [columns, setColumns] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(versions[0]?._id);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (selectedVersion) {
      fetchData();
    }
  }, [selectedVersion]);

  const fetchFields = async () => {
    setColumns(null);
    const data = await fetch_child_resource_fields(childResource, referenceData?.currency, false);
    const newColumns = generateColumns(renderedFrom, data, null, false, referenceData?.currency);
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
        disabled: true,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{`${startCase(row.original?.type)} `}</p>
          </div>
        )
      },
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        sticky: isMobile || isTablet ? 'none' : 'left',
        disabled: true,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p title={row.original.detail}>{row.original.detail}</p>
            {['product', 'service'].includes(row.original.type) && (
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === 'service') {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'product') {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            )}
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
    setColumns([...column, ...newColumns]);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    let data = [];

    const version = await axiosInstance().get(`${fieldTicket.api}/${selectedVersion}/version?resource=${resource}&id=${id}`);
    const versionData = version.data.data;

    const material = versionData?.material || [];
    const cost = versionData?.cost || [];

    material?.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent?.type === 'service' ? parent?.serviceDetail?.serviceName : parent?.type === 'product' ? parent?.productDetail?.productName : '';
      parent.description =
        parent?.type === 'service'
          ? parent?.serviceDetail?.serviceDescription
          : parent?.type === 'product'
            ? parent?.productDetail?.productDescription
            : '';
    });

    cost?.forEach((ele, i) => {
      ele.index = i + 1 + material?.length;
      ele.type = 'manualEntry';
      ele.detail = ele.description;
    });

    data = [...material, ...cost];

    dispatch({ type: 'initialize', data: data, count: data?.length });
    dispatch({ type: 'loading', loading: false });
  };

  return (
    <>
      <Dialog
        open
        fullScreen={fullScreen}
        TransitionComponent={CustomDialogTransition}
        maxWidth="md"
        fullWidth
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }}
      >
        <CustomDialogHeader
          title={`Versions - ${label}`}
          onClose={handleClose}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showRequiredLabel={false}
          showManimizeMaximize={true}
        />
        <CustomDialogContent isFooterPresent={false}>
          <Box width={'100%'} display="flex" flexWrap="wrap">
            {versions &&
              versions?.map((v: any, i) => (
                <Box
                  m={0.5}
                  p={1}
                  border={1}
                  className="cursor-pointer"
                  borderColor="var(--common-border-color)"
                  onClick={() => {
                    if (selectedVersion !== v?._id) {
                      setSelectedVersion(v?._id);
                    }
                  }}
                  style={{ display: 'inline-block' }}
                  bgcolor={v?._id === selectedVersion ? 'var(--dark-primary, var(--primary))' : 'var(--dark-secondary, transparent)'}
                  color={v?._id === selectedVersion && 'white'}
                >
                  {`Version - ${i + 1}`}
                </Box>
              ))}
          </Box>
          {columns ? (
            <Box zIndex={5} width={'100%'} mt={2}>
              <CustomReactTable
                height={'calc(100vh - 200px)'}
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
        </CustomDialogContent>
      </Dialog>
    </>
  );
}

export default Versions;
