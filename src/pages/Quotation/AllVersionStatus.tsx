import { Dialog, IconButton, Tooltip } from '@material-ui/core';
import { useContext, useReducer, useState } from 'react';
import axiosInstance from '../../axios/axiosInstance';
import { formatAmountWithCurrency, gridLoadingTimeout } from '../../constants/helpers';
import { Link } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useEffect } from 'react';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import { isMobile, isTablet } from 'react-device-detect';

export default function AllVersionStatus({
  open,
  onClose,
  quotationId,
  quotationData,
  quotationPermissions,
  fetchQuotationData,
  handleChangeVersionFromAllVersion,
  handleCloneQuoteWithVersionFromAllVersion
}) {
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [columns] = useState([
    { field: 'version', headerName: 'Version #', show: true, width: 140, disabled: true, cellRenderer: 'nameRenderer' },
    { field: 'status', headerName: 'Status', show: true, cellRenderer: 'commonRenderer' }
  ]);
  const NameRenderer = (params) => (
    <span
      className="link"
      onClick={() => {
        handleChangeVersionFromAllVersion(params.data.version);
      }}
    >
      <CustomRenderCell value={params?.value} />
    </span>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer
  };

  useEffect(() => {
    if (quotationId) {
      getVersionStatus();
    }
  }, [quotationId]);

  const getVersionStatus = () => {
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
    <Dialog
      maxWidth="md"
      aria-labelledby="customized-dialog-title"
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
    >
      <CustomDialogHeader
        title={`All Version Status`}
        onClose={onClose}
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
          actionWidth={150}
          allowSelection={false}
          loading={loading}
          refreshGrid={getVersionStatus}
        />
      </CustomDialogContent>
    </Dialog>
  );
}
