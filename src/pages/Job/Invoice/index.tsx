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

const Invoice = ({ renderedFrom }) => {
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

  useEffect(() => {
    fetchGridColumns();
  });

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Invoice`);
    data = response?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.jobDetail.path);
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
      ...tempFrameworkComponent,
      actionsRenderer: ActionsRenderer
    };
    setFrameworkComponent({ ...tempFrameworkComponent });
    columns = [...columns, ...getStaticFields()];
    setColumns([...columns]);

    if (JSON.parse(sessionStorage.getItem('filters')) !== null) {
      let savedFilter = JSON.parse(sessionStorage.getItem('filters'));
      dispatch({ type: 'filter', filters: savedFilter });
    }
  };

  const ActionsRenderer = (params) => {
    <>
      <HtmlTooltip title="Delete">
        <IconButton
          size="small"
          aria-label="Delete"
          onClick={() => {
            setSingleDelete({
              show: true,
              id: params.data._id
            });
          }}
        >
          <DeleteIcon color="error" />
        </IconButton>
      </HtmlTooltip>
    </>;
  };

  const handleSingleDelete = async () => {};

  const fetchInvoiceData = async () => {};

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
            renderedFrom={renderedFrom}
            refreshGrid={fetchInvoiceData}
            showOnlyShowFilteredRecordSwitch={true}
          />
        ) : (
          <Box p={2} height={500} bgcolor="white">
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
