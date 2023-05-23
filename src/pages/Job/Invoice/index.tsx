import { useState, useEffect, useReducer, Fragment, useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import useColumns, { getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import { Box, IconButton } from '@material-ui/core';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import {
  isObjectEmpty,
  customerAccount,
  supplierAccount,
  gridLoadingTimeout,
  invoice,
  sidebarResource,
  prepareDataForGrid,
  getLocalStorageArrayData,
  removeLocalStorage
} from '../../../constants/helpers';
import { useData } from 'src/StateProvider/Provider';

const Invoice = () => {
  const { getColumnData } = useColumns();
  const [frameworkComponent, setFrameworkComponent] = useState({});
  const [columns, setColumns] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;
  const [gridApi, setGridApi] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [singleDelete, setSingleDelete] = useState({
    id: null,
    show: false
  });
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  useEffect(() => {
    fetchGridColumns();
    fetchInvoiceData();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Invoice`);
    data = response?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(routes.invoice.title, o?.fieldData, routes.invoiceDetail.path);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
          rendererNames.push(currentColumn?.rendererName);
        }
      }
      return o?.fieldData;
    });
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      ...tempFrameworkComponent
      //actionsRenderer: ActionsRenderer
    };
    setFrameworkComponent({ ...tempFrameworkComponent });
    columns = [...columns, ...getStaticFields()];
    setColumns([...columns]);
  };

  // const ActionsRenderer = (params) => {
  //   <>
  //     <HtmlTooltip title="Delete">
  //       <IconButton
  //         size="small"
  //         aria-label="Delete"
  //         onClick={() => {
  //           setSingleDelete({
  //             show: true,
  //             id: params.data._id
  //           });
  //         }}
  //       >
  //         <DeleteIcon color="error" />
  //       </IconButton>
  //     </HtmlTooltip>
  //   </>;
  // };

  const handleSingleDelete = async () => {};

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    return deepFilter;
  };

  const fetchInvoiceData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${invoice.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['isChecked'] = false;
          finalObject['allowedToEdit'] = permissions?.invoice?.isUpdate;
          finalObject['canDelete'] = permissions?.invoice?.isDelete && u?.canDelete;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Box>
        {Object.keys(frameworkComponent).length > 0 && columns ? (
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameworkComponent}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            actionWidth={100}
            loading={loading}
            allowAction={false}
            renderedFrom={'job_invoice'}
            refreshGrid={fetchInvoiceData}
            showOnlyShowFilteredRecordSwitch={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {singleDelete.show && (
        <ConfirmationDialog
          open={singleDelete.show}
          message={`Are you sure you want to delete ?`}
          onClose={() =>
            setSingleDelete({
              id: null,
              show: false
            })
          }
          onOk={handleSingleDelete}
        />
      )}
    </Fragment>
  );
};

export default Invoice;
