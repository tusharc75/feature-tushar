
import { CHILD_RESOURCE, quotation } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import { CURReplaceByCurrencySingle } from '../../constants/formulaUtility';

export const fetch_quotation_product_fields = async (currency) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.quotationProduct}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    return data;
}

export const fetch_quotation_cost_fields = async (currency) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.quotationCost}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    return data;
}

export const fetch_quotation_service_fields = async (currency) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.quotationService}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    return data;
}

export const handleViewPdf = (view = false, download = false, quotationData = null) => {
    // setViewDownloadLoading(true);
    axiosInstance()
        .get(`/quotation/${quotationData._id}/pdf`)
        .then(({ data }) => {
            if (view && data.data.fileName) {
                axiosInstance()
                    .get(`user/download?fileName=${data.data.fileName}`, {
                        responseType: 'blob'
                    })
                    .then(({ data }) => {
                        const file = new Blob([data], { type: 'application/pdf' });
                        const fileURL = URL.createObjectURL(file);
                        const pdfWindow = window.open();
                        pdfWindow.location.href = fileURL;
                        //   setViewDownloadLoading(false);
                    })
                    .catch((err) => {
                        //   setViewDownloadLoading(false);
                        // toastConfig.setToastConfig(err);
                    });
            } else if (download && data.data.fileName) {
                axiosInstance()
                    .get(`user/download?fileName=${data.data.fileName}`, {
                        responseType: 'blob'
                    })
                    .then(({ data }) => {
                        const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `Quotation-${quotationData?.quotationNumber}.pdf`);
                        document.body.appendChild(link);
                        link.click();
                        //   setViewDownloadLoading(false);
                    })
                    .catch((err) => {
                        // toastConfig.setToastConfig(err);
                        //   setViewDownloadLoading(false);
                    });
            } else {
                //   setViewDownloadLoading(false);
            }
        })
        .catch((err) => {
            // toastConfig.setToastConfig(err);
            // setViewDownloadLoading(false);
        });

};

export const checkDOA = async (selectedEntity, quotationData, versionId) => {
    const responseDoa = await axiosInstance().post('doa-request/limit', { entity: selectedEntity })
    const DOAsetup = responseDoa?.data?.data.doasetup
    const DOAlimit = responseDoa?.data?.data.limit && responseDoa?.data?.data.limit !== 0 ? responseDoa?.data?.data.limit : responseDoa?.data?.data.minLimit;
    const response = await axiosInstance().get(`${quotation.api}/productpackage/${quotationData._id}/${versionId}`);
    const data = response?.data?.data;
    const rows = data.material.filter((e) => e.parentId === null);
    const totalFinalPrice = rows
        .filter(
            (f) =>
                f?.parentId === null &&
                f?.hasOwnProperty('finalPrice_' + quotationData?.currency?.toLowerCase()) &&
                !isNaN(f['finalPrice_' + quotationData?.currency?.toLowerCase()])
        )
        .reduce((sum, row) => row['finalPrice_' + quotationData?.currency?.toLowerCase()] + sum, 0);

    if (DOAsetup && totalFinalPrice > DOAlimit) {
        return true;
    } else {
        return false;
    }


};
