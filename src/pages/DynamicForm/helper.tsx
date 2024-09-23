import axiosInstance from "src/axios/axiosInstance";

export const DynamicProcessStatusUpdate = async (resource: string, processStatus: string, id: string)=>{
  axiosInstance().put(`dynamic-form/process-status`, { processStatus: processStatus, _id: id }, {
    headers: {
    Resource: resource
  }
}).then(({ data }) => { })
  .catch((error) => { });
}