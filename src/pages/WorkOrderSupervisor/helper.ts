import axiosInstance from "src/axios/axiosInstance";
import { columns } from '../WorkOrder/WorkOrderDetailContent';
import { ASSET_STATUS, INVENTORY_OWNER_TYPE, sidebarResource } from "src/constants/helpers";
import { map, uniq } from "lodash";

export const queryStringPlanned = (queryString) => {
  const queryParams = queryString.startsWith('&') ? queryString.slice(1).split('&') : queryString.split('&');
  const params = queryParams.reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    acc[key] = value;
    return acc;
  }, {});
  const filterByIds: any = [];
  const nIn = params['nIn'];
  Object.keys(params)?.map((_k) => {
    if (['service']?.includes(_k)) {
      if (nIn && nIn?.length > 0 && nIn?.includes(_k)) {
        filterByIds.push({ field: _k, term: { $nin: params[_k]?.split(',') } });
      } else {
        filterByIds.push({ field: _k, term: { $in: params[_k]?.split(',') } });
      }
    }
  });

  return filterByIds;
};

const fetchViewColumns = async () => {
  const res = await axiosInstance().get(`pdf/view?resource=${sidebarResource.workOrder}`);
  const data = res?.data?.data;
  if (data?.length > 0) {
    let view = data?.find((e) => e?.default);
    if (view) {
      return view?.columns;
    } else {
      return data[0]?.columns;
    }
  }
  return [];
}

export const handlePdfPreview = async (workOrderId, user, toastConfig) => {
  toastConfig.setToastConfig({
    message: "Previewing PDF",
    open: true,
    type: "info"
  });
  const viewColumns = await fetchViewColumns();
  let pdfCols = [];
  if (viewColumns?.length > 0) {
    pdfCols = viewColumns?.filter((e) => columns?.some((c) => c?.accessor === e?.accessor));
  } else {
    pdfCols = columns?.map((e) => {
      return { name: e?.accessor }
    })
  }
  if (!user?.brandPolicy?.servicePrePost) {
    pdfCols = pdfCols?.filter((e) => e?.name !== 'serviceType');
  }
  await axiosInstance()
    .get(`/pdf/${workOrderId}?resource=${sidebarResource.workOrder}&columns=${JSON.stringify(pdfCols)}`, { responseType: 'blob' })
    .then((response) => {
      const blobData = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(blobData);
      const link = document.createElement('a');
      link.href = fileURL;
      link.target = '_blank';
      link.style.display = 'none';
      link.click();
      toastConfig.setToastConfig({ open: true, type: 'success', message: 'File Previewing Successfully' });
    }).catch((err) => {
      toastConfig.setToastConfig(err);
    });
};

export const checkUniqWarehouse = (selectedRecords) => {
  if (selectedRecords.length === 0) {
    return false;
  } else if (uniq(map(selectedRecords, 'warehouseId')).length === 1) {
    return true;
  } else {
    return false;
  }
};


export const isCreateRepairOrderDisabled = (selectedRecords) => {
  return (
    selectedRecords?.length === 0 ||
    selectedRecords.some((r) => r?.repairOrderId) ||
    selectedRecords?.some(
      (r) =>
        ![
          ASSET_STATUS.new,
          ASSET_STATUS.available,
          ASSET_STATUS.scrap,
          ASSET_STATUS.underReview,
          ASSET_STATUS.needRepair,
          ASSET_STATUS.needRecert,
          ASSET_STATUS.customerPossession
        ].includes(r?.assetStatus)
    ) ||
    selectedRecords.some((r) => r?.currentOwnerType !== INVENTORY_OWNER_TYPE.brand) ||
    !checkUniqWarehouse(selectedRecords)
  );
};