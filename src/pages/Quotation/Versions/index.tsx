import { Dialog, IconButton, Tooltip } from '@material-ui/core';
import { useContext, useReducer, useState } from 'react';
import axiosInstance from '../../../axios/axiosInstance';
import { formatAmountWithCurrency, gridLoadingTimeout } from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useEffect } from 'react';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import CustomRenderCell from '../../../components/Helpers/CustomRenderCell';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { isMobile, isTablet } from 'react-device-detect';
import { camelCase } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import { Link } from 'react-router-dom';

export default function Version({ onClose, quotationId, handleChangeVersion, refrenceType = "" }) {

  const renderedFrom = `${camelCase(routes?.quotation.title)}_versions`;

  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [columns] = useState([
    { field: 'version', headerName: 'Version', show: true, width: 140, disabled: true, cellRenderer: 'nameRenderer' },
    { field: 'quotationNumber', headerName: 'Quotation Number', show: true, cellRenderer: 'quotationNumberRenderer' },
    { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' },
    { field: 'comment', headerName: 'Comment', show: true, cellRenderer: 'commonRenderer' },
  ]);

  useEffect(() => {
    if (quotationId) {
      fetchData();
    }
  }, [quotationId]);

  const NameRenderer = (params) => (
    refrenceType === "rentalJob" || refrenceType === "repairOrder" ?
      <span>{params.data.version}</span> :
      <span
        className="link"
        onClick={() => {
          handleChangeVersion(params.data.version);
        }}
      >
        <CustomRenderCell value={params?.value} />
      </span>
  );

  const QuotationNumberRenderer = (params) => (
    <Link className="link text-truncate"
      title={params.value} to={`${routes.quotationDetail.path}/${params.data?.quotationId}`}>
      {params.value}
    </Link>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    quotationNumberRenderer: QuotationNumberRenderer,
    commonRenderer: CommonRenderer
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`/quotation/${quotationId}`)
      .then(({ data: { data } }) => {
        const newData: any = Object.entries(data?.versions)?.map(([key, value]) => {
          return {
            ...data?.versions[key],
            quotationNumber: data?.quotationNumber,
            quotationId: data?._id,
            id: key
          };
        });
        dispatch({ type: 'initialize', data: newData, count: newData.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <Dialog maxWidth="md" aria-labelledby="customized-dialog-title" open onClose={onClose} fullWidth fullScreen={fullScreen || isMobile || isTablet}>
      <CustomDialogHeader
        title={`All Version Status`}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        showRequiredLabel={false}
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
          actionWidth={150}
          isClientSideGrid={true}
          allowSelection={false}
          loading={loading}
          refreshGrid={fetchData}
          renderedFrom={renderedFrom}
        />
      </CustomDialogContent>
    </Dialog>
  );
}
