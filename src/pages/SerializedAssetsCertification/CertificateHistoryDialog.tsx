import { Box, Dialog } from '@material-ui/core';
import { Fragment, useContext, useEffect, useState, useReducer } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import routes from '../../components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { prepareDataForGrid, serializedAsset } from '../../constants/helpers';
import { Link } from 'react-router-dom';
import { camelCase } from 'lodash';
import { staticFrameworkRender } from 'src/constants/useColumns';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { CommonRenderer, DateRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import { CustomDialogTransition } from 'src/constants/helpers';

const CertificateHistoryDialog = ({ onClose, id }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${serializedAsset.api}/${id}/certificate`)
      .then(({ data: { data } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: rows.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const columns = [
    { field: 'issueDate', headerName: 'Issue Date', show: true, filter: false, sortable: false, disabled: true, cellRenderer: 'dateRenderer' },
    { field: 'expiryDate', headerName: 'Expiry Date', show: true, filter: false, sortable: false, disabled: true, cellRenderer: 'dateRenderer' },
    { field: 'supplierAccount', headerName: 'Certification Supplier', show: true, cellRenderer: 'supplierAccountRenderer' },
    { field: 'createdBy', headerName: 'Created By', show: true, filter: false, sortable: false, cellRenderer: 'createdByRenderer' },
  ];

  const SupplierAccountRenderer = (params: { value: any; data: any }) => (
    <>
      {params.value ? (
        <Link className="link" target='_blanck' title={params.value} to={`${routes.supplierAccountDetail.path}/${params.data.supplierAccountId}`}>
          {params.value}
        </Link>
      ) : (
        <NoDataCell />
      )}
    </>
  );

  const frameworkComponents = {
    supplierAccountRenderer: SupplierAccountRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer,
    ...staticFrameworkRender
  };


  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={() => onClose()}
    >
      {columns ? (
      <Fragment>
        <CustomDialogHeader
                onClose={() => {
                  onClose();
                }}
                title={'Certificate Histrory'}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <CustomAgGrid
                  columns={columns}
                  dataRows={dataRows}
                  frameworkComponents={frameworkComponents}
                  setGridApi={setGridApi}
                  dispatch={dispatch}
                  rowCount={rowCount}
                  limit={limit}
                  pageSizes={pageSizes}
                  page={page}
                  allowAction={false}
                  allowSelection={false}
                  isClientSideGrid={true}
                  loading={loading}
                  renderedFrom={`${camelCase(routes?.serializedAsset.title)}_certificationHistory`}
                  refreshGrid={fetchData}
                />
              </CustomDialogContent>
      </Fragment>
    ) : (
      <Box p={2} height={500}>
        <CommonSkeleton lenArray={[...Array(10).keys()]} />
      </Box>
    )}
    </Dialog>
  );
};


export default CertificateHistoryDialog;
