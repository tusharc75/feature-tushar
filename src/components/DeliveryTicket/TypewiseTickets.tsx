import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from '../AgGridComponents/CustomAgGrid';
import routes from '../Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import Button from '@material-ui/core/Button';
import { AiFillFilePdf } from 'react-icons/ai';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { gridLoadingTimeout, deliveryTicket, serializedAsset } from '../../constants/helpers';
import { useHistory } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../SwipableListComponents/CustomSwipableList';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import { prepareDataForGrid } from '../../constants/helpers';
import { useData } from '../../StateProvider/Provider';
import { PickupFromRenderer, DeliveryToRenderer } from './helper';

const TypewiseTickets = ({ referenceType, referenceId, renderedFrom }) => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const { getColumnData } = useColumns();
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState(null);
  const [downlodingFile, setDownlodingFile] = useState(false);
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Delivery Ticket')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data = data.filter((e) => !['productInventory', 'pickupFromType', 'deliveryToType'].includes(e?.fieldData?.fieldName));
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.deliveryTicketDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          pickupFromRenderer: PickupFromRenderer,
          deliveryToRenderer: DeliveryToRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        columns = columns.filter((e) => !['warehouse', 'customerAccount', 'supplierAccount'].includes(e.field));
        columns.forEach((e) => {
          if (e.field === 'pickupFrom') {
            e.cellRenderer = 'pickupFromRenderer';
          }
          if (e.field === 'deliveryTo') {
            e.cellRenderer = 'deliveryToRenderer';
          }
        });
        setColumns([...columns]);
        fetchRecords();
      });
  };

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    let data;
    const response = await axiosInstance().get(`${deliveryTicket.api}/typewise?referenceType=${referenceType}&referenceId=${referenceId}`);
    data = response?.data?.data;
    let rows = data.map((u) => {
      let finalObject = prepareDataForGrid(u, user);
      finalObject['isChecked'] = false;
      return finalObject;
    });
    dispatch({ type: 'initialize', data: rows, count: rows.length });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };

  return (
    <>
      <Box display="flex" justifyContent="flex-end" p={1} pt={1} pb={0}>
        {!isMobile && (
          <Button
            onClick={() => {
              setDownlodingFile(true);
              axiosInstance()
                .post(`/delivery-ticket/pdf`, {
                  ids: selectedRecords.length > 0 ? selectedRecords.map((s) => s._id) : dataRows.map((d) => d._id)
                })
                .then(({ data }) => {
                  axiosInstance()
                    .get(`user/download?fileName=${data.data.fileName}`, {
                      responseType: 'blob'
                    })
                    .then(({ data }) => {
                      const file = new Blob([data], { type: 'application/pdf' });
                      const fileURL = URL.createObjectURL(file);
                      const pdfWindow = window.open();
                      pdfWindow.location.href = fileURL;
                      toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
                      setDownlodingFile(false);
                    })
                    .catch((err) => {
                      toastConfig.setToastConfig(err);
                      setDownlodingFile(false);
                    });
                })
                .catch((err) => {
                  toastConfig.setToastConfig(err);
                  setDownlodingFile(false);
                });
            }}
            variant={isMobile && !isTablet ? 'text' : 'outlined'}
            color="primary"
            type="button"
            size="small"
            disabled={downlodingFile || dataRows.length === 0}
            startIcon={<AiFillFilePdf />}
          >
            {downlodingFile ? 'Please wait...' : 'Preview'}
          </Button>
        )}
      </Box>
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={true}
              primaryField={columns?.find((d) => d.field)}
              onClick={(data) => {
                history.push(`${routes.deliveryTicketDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={false}
              extraParamsToCheckDelete={true}
              onDelete={false}
              rowCount={rowCount}
              page={page}
              loading={loading}
              additionalDetails={[]}
              chips={[
                {
                  label: 'Status : ',
                  field: 'status'
                },
                {
                  label: 'Pickup From : ',
                  field: 'pickupFrom'
                },
                {
                  label: 'Delivery To : ',
                  field: 'deliveryTo'
                }
              ]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={false}
              onClone={() => {}}
              renderedFrom={renderedFrom}
            />
          ) : (
            <CustomAgGrid
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameWorkComponent}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              allowAction={false}
              loading={loading}
              isClientSideGrid={true}
              allowSelection={true}
              renderedFrom={renderedFrom}
              refreshGrid={fetchRecords}
            />
          )
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
    </>
  );
};

export default TypewiseTickets;
