import React from 'react';
import { Box, Button, IconButton } from '@material-ui/core';
import AddConfigurationDialog from './AddConfigurationDialog';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid } from '../../../constants/helpers';
import CarouselDialog from '../../../components/CarouselDialog';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import useColumns, { getFrameworkComponents } from '../../../constants/useColumns';
import { Delete, Edit } from '@material-ui/icons';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import DeleteButton from '../../../components/Helpers/DeleteButton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
interface ConfigProps {
  productFields: any[];
  productData: any | {};
  id: string;
}

const ProductConfiguration = (props: ConfigProps) => {
  const initialRender = React.useRef(true);
  const { productData, id } = props;
  const {setToastConfig} = React.useContext(CustomToastContext)
  const [specFields, setSpecFields] = React.useState([]);
  const [configData, setConfigData] = React.useState([]);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [showConfirmBox, setShowConfirmBox] = React.useState({
    open: false,
    ids: []
  });
  const [carouselDialog, setCarouselDialog] = React.useState({
    open: false,
    images: [],
    index: 0
  });
  const [editConfig, setEditConfig] = React.useState({
    values: {},
    images: []
  });

  const { getColumnData } = useColumns();
  const [frameWorkComponent, setFrameWorkComponent] = React.useState({});
  const [columns, setColumns] = React.useState([]);
  const [gridApi, setGridApi] = React.useState(null);
  const [state, dispatch] = React.useReducer(reducer, intialState);
  const { dataRows, rowCount, loading: gridLoading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  React.useEffect(() => {
    if (productData) {
      getTemplateFields();
    }
    if (initialRender) {
      getConfigurationData();
      initialRender.current = false;
    }
  }, [productData]);

  const ActionRenderer = (params) => (
    <>
      <IconButton size="small" color="inherit" onClick={() => editData(params.data)}>
        <Edit fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        color="inherit"
        onClick={() => {
          setShowConfirmBox({
            open: true,
            ids: [params.data.id]
          });
        }}
      >
        <Delete color="error" fontSize="small" />
      </IconButton>
    </>
  );

  const editData = (data) => {
    const { images, ...rest } = data;
    setEditConfig({
      values: rest,
      images: images
    });
    setOpenDialog(true);
  };

  const getTemplateFields = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.productTemplate.path}/fields/${productData.productTemplate}`);
      const { fields } = data;
      setSpecFields(fields);
      let columns = [];
      let rendererNames = [];
      fields.forEach((o) => {
        let currentColumn = getColumnData(routes.product.title, o, routes.product.path);
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
        actionsRenderer: ActionRenderer
      };
      setFrameWorkComponent({ ...tempFrameworkComponent });
      setColumns([...columns]);
    } catch (err) {
      setToastConfig(err);
    }
  };

  const getConfigurationData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes.product.path}/${id}/images`)
      .then(({ data: { data } }) => {
        setConfigData(data);
        const rows = data.map((d) => {
          let finalObject = prepareDataForGrid(d.productConfiguration);
          finalObject['images'] = d.images;
          finalObject['id'] = d._id;
          finalObject['_id'] = d._id;

          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: rows.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        setToastConfig(err)
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const removeData = () => {
    setRemoving(true);
    axiosInstance()
      .put(`${routes.product.path}/${id}/images/remove`, {
        ids: showConfirmBox.ids
      })
      .then(() => {
        setShowConfirmBox({
          open: false,
          ids: []
        });
        getConfigurationData();
        setRemoving(false);
      })
      .catch((err) => {
        setShowConfirmBox({
          open: false,
          ids: []
        });
        setRemoving(false);
        setToastConfig(err)
      });
  };

  return (
    <Box>
      <Box p={2} display="flex" justifyContent="space-between">
        <div />
        <Box display="flex">
          <Box mr={2} component={'div'}>
            <DeleteButton
              onClick={() => {
                setShowConfirmBox({
                  open: true,
                  ids: selectedRecords.map((s) => s.id)
                });
              }}
              size="small"
              disabled={selectedRecords.length === 0}
              disableElevation
              text={'Delete'}
            />
          </Box>
          <Button onClick={() => setOpenDialog(true)} size="small" variant="contained" color="primary" disableElevation>
            Add Images
          </Button>
        </Box>
      </Box>
      <Box>
        {Object.keys(frameWorkComponent).length > 0 && (
          <CustomAgGrid
            allowSelection={true}
            allowAction={true}
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameWorkComponent}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            actionWidth={150}
            loading={gridLoading}
            isClientSideGrid
            renderedFrom="productMasterDetailsPageProductImages"
          />
        )}
      </Box>
      {openDialog && (
        <AddConfigurationDialog
          fields={specFields}
          data={Object.values(editConfig.values).length > 0 ? editConfig : null}
          close={() => setOpenDialog(false)}
          id={id}
          fetchData={getConfigurationData}
        />
      )}
      {carouselDialog.open && (
        <CarouselDialog
          index={carouselDialog.index}
          close={() => {
            setCarouselDialog({
              open: false,
              images: [],
              index: 0
            });
          }}
          images={carouselDialog.images}
        />
      )}
      {showConfirmBox.open && (
        <ConfirmationDialog
          open={true}
          okBtnLoading={removing}
          message={`Are you sure you want to delete?`}
          onClose={() => {
            setShowConfirmBox({
              open: false,
              ids: []
            });
          }}
          onOk={removeData}
        />
      )}
    </Box>
  );
};

export default ProductConfiguration;
