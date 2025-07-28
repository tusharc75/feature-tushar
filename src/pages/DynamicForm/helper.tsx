import { camelCase } from "lodash";
import axiosInstance from "src/axios/axiosInstance";

export const dynamicFormUpdateProcessStatus = async (resource: string, processStatus: string, id: string) => {
  axiosInstance().put(`dynamic-form/process-status`, { processStatus: processStatus, _id: id }, {
    headers: {
      Resource: resource
    }
  }).then(({ data }) => { })
    .catch((error) => { });
}

export const fetchResourcePolicy = async (resource: string, permissions: any) => {
  let resourceData: any = null
  const { data: { data } } = await axiosInstance().get(`/dynamic-form/policy?resource=${resource}`);
  if (data) {
    let { tabs, ...rest } = data;

    tabs = tabs?.filter(t => {
      if (!t?.steps?.length) {
        return false
      }
      if (t?.steps?.every(s => s?.linkResourceName && permissions[camelCase(s?.linkResourceName)]?.isRead)) {
        return false
      }
      return true
    })

    resourceData = { ...rest, tabs: tabs }
  }
  return resourceData;
}