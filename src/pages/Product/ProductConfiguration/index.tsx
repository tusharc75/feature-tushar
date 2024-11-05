import { Box, IconButton, MenuItem } from '@material-ui/core';
import { Delete, Edit } from '@material-ui/icons';
import React from 'react';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import CarouselDialog from '../../../components/CarouselDialog';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import routes from '../../../components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid } from '../../../constants/helpers';
import AddConfigurationDialog from './AddConfigurationDialog';

interface ConfigProps {
  productFields: any[];
  productData: any | {};
  id: string;
  renderedFrom: string;
}

const ProductConfiguration = (props: ConfigProps) => {
  const initialRender = React.useRef(true);
  const {
    state: { permissions }
  }: any = useData();
  const { productData, id, renderedFrom } = props;
  const { setToastConfig } = React.useContext(CustomToastContext);
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
  const { generateColumns } = useColumns();
  const [columns, setColumns] = React.useState([]);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  React.useEffect(() => {
    if (productData) {
      getTemplateFields();
    }
    if (initialRender) {
      getConfigurationData();
      initialRender.current = false;
    }
  }, [productData]);

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <IconButton size="small" color="inherit" onClick={() => editData(row?.original)}>
          <Edit fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="inherit"
          onClick={() => {
            setShowConfirmBox({
              open: true,
              ids: [row?.original?.id]
            });
          }}
        >
          <Delete color="error" fontSize="small" />
        </IconButton>
      </>
    )
  };

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
      const newColumns = generateColumns(renderedFrom, fields, routes.product.path, true);
      setColumns([...newColumns, ActionsRenderer]);
    } catch (err) {
      setToastConfig(err);
    }
  };

  const getConfigurationData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
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
        setToastConfig(err);
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
        setToastConfig(err);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem onClick={() => setOpenDialog(true)}>Add Images</MenuItem>
      </>
    );
  };

  const rightSideContents = () => {
    return (
      <>
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
      </>
    );
  };

  return (
    <Box>
      {permissions?.product?.isUpdate && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonMenuItems={addButtonMenuItems()}
            isActionButtonVisible={false}
            rightSideContents={rightSideContents()}
            hasXpadding={false}
          />
        </>
      )}
      <Box>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={() => {}}
            isClientSideGrid={true}
            hideAction={!permissions?.product}
            hideSelection={!permissions?.product?.isUpdate}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
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
