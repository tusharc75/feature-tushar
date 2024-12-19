import { Box } from '@material-ui/core';
import { Fragment, useCallback, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { rentalManagement, sidebarResource } from 'src/constants/helpers';
import AddSerializedAssets from 'src/pages/ScheduleAndDispatch/Scheduler/AddSerializedAssets';
import AddServices from 'src/pages/ScheduleAndDispatch/Scheduler/AddServices';
import AddTechnicians from 'src/pages/ScheduleAndDispatch/Scheduler/AddTechnician';
import ManageScheduleRental from 'src/pages/ScheduleAndDispatch/Scheduler/ManageScheduleRental';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const initialState: any = {
  asset: false,
  service: false,
  technician: false,
  customerDetail: false
};

const Scheduler = () => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { resources, user }
  }: any = useData();

  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [isExpand, setIsExpand] = useState({ ...initialState, asset: true });
  const [loading, setLoading] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [warehouseOptions, setWarehouseOptions] = useState(null);
  const [productOptions, setProductOptions] = useState(null);

  const handleOpen = useCallback((key: string) => {
    setIsExpand((prevState) => ({
      ...initialState,
      [key]: !prevState[key]
    }));
  }, []);

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.warehouse},${sidebarResource.product}`)
      .then(({ data: { data } }) => {
        setWarehouseOptions(data[sidebarResource.warehouse]);
        setProductOptions(data[sidebarResource.product]);
        if (data[sidebarResource.warehouse]?.length) {
          setSelectedWarehouse(data[sidebarResource.warehouse][0]?.optionValue);
        }
      });
  }, []);

  const handleSave = async (values) => {
    setLoading(true);

    const materialData = {
      assets:
        selectedAssets?.map((a) => ({
          asset: a?._id
        })) || [],
      services: selectedServices?.map((s) => s._id) || [],
      technicians: selectedTechnicians?.map((a) => a?._id) || []
    };

    try {
      const { data } = await axiosInstance().post(`${rentalManagement.api}/schedule-and-dispatch`, {
        ...values,
        warehouse: selectedWarehouse,
        materialData
      });

      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data?.message
      });

      setSelectedAssets([]);
      setSelectedServices([]);
      setSelectedTechnicians([]);
      setIsExpand({ ...initialState, asset: true });
      setSelectedWarehouse(warehouseOptions[0]?.optionValue);
      setSelectedProduct(null);
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <Box>
        <div className="mt-2 flex w-full flex-col gap-6">
          <div>
            <AddSerializedAssets
              setSelectedAssets={setSelectedAssets}
              isExpand={isExpand.asset}
              resources={resources}
              handleOpen={handleOpen}
              setSelectedWarehouse={setSelectedWarehouse}
              selectedWarehouse={selectedWarehouse}
              setSelectedProduct={setSelectedProduct}
              selectedProduct={selectedProduct}
              warehouseOptions={warehouseOptions}
              productOptions={productOptions}
              submitLoad={loading}
            />
          </div>
          <div>
            <AddServices
              setSelectedServices={setSelectedServices}
              selectedAssets={selectedAssets}
              isExpand={isExpand.service}
              handleOpen={handleOpen}
              resources={resources}
              selectedWarehouse={selectedWarehouse}
              submitLoad={loading}
            />
          </div>
          <div>
            <AddTechnicians
              selectedServices={selectedServices}
              setSelectedTechnicians={setSelectedTechnicians}
              isExpand={isExpand.technician}
              resources={resources}
              handleOpen={handleOpen}
              submitLoad={loading}
              selectedWarehouse={selectedWarehouse}
            />
          </div>
          <div>
            <ManageScheduleRental isExpand={isExpand.customerDetail} handleSave={handleSave} loading={loading} handleOpen={handleOpen} user={user} />
          </div>
        </div>
      </Box>
    </Fragment>
  );
};

export default Scheduler;
