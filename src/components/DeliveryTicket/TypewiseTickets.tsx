import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import Grid from '@material-ui/core/Grid/Grid';
import Button from '@material-ui/core/Button';
import { AiFillFilePdf } from 'react-icons/ai';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { gridLoadingTimeout, deliveryTicket, sidebarResource } from '../../constants/helpers';
import { useHistory } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import { prepareDataForGrid } from '../../constants/helpers';
import { useData } from '../../StateProvider/Provider';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import routes from '../Helpers/Routes';

const TypewiseTickets = ({ referenceType, referenceId, renderedFrom }) => {
  
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer();
  
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);
  const [downlodingFile, setDownlodingFile] = useState(false);
  const {
    state: { user, }
  }: any = useData();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.deliveryTicket}`)
      .then(({ data: { data } }) => {
        let columns = [];
        data = data.filter((e) => !['productInventory', 'pickupFromType', 'deliveryToType'].includes(e?.fieldData?.fieldName));
        let newColumns = generateColumns(renderedFrom, data, routes.deliveryTicketDetail.path);
        columns = [...newColumns, ...getStaticFields()];
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
                .get(`pdf/multiple?resource=${sidebarResource.deliveryTicket}&ids=${selectedRecords.length > 0 ? selectedRecords.map((s) => s._id) : dataRows.map((d) => d._id)}`, {
                  responseType: 'blob'
                })
                .then(({ data }) => {
                  const file = new Blob([data], { type: 'application/pdf' });
                  const fileURL = URL.createObjectURL(file);
                  const link = document.createElement('a');
                  link.href = fileURL;
                  link.target = '_blank';
                  link.style.display = 'none';
                  link.click();
                  toastConfig.setToastConfig({ open: true, type: 'success', message: 'File Previewed Successfully.' });
                  setDownlodingFile(false);
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
          <CustomReactTable
            height={'calc(100vh - 300px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchRecords}
          />
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
