import React from "react";
import moment from "moment";
import { AiOutlineLoading } from "react-icons/ai";
import CustomRenderCell from "../Helpers/CustomRenderCell";
import NoDataCell from "../Helpers/NoDataCell";
import { dateFormat } from "../../constants/helpers"

export const CommonRenderer = params => <CustomRenderCell value={params.value} />;

export const CommonRendererWithCopy = params => <CustomRenderCell value={params.value} isCopyToClipboard={true} />;

export const CreatedByRenderer = params => params.value ? (
    <h5 className="createBy" title={`${params.value} • ${moment(
        params.data.createdByDate.slice(0, 10)
    ).format(dateFormat)}`}>
        {params.value}
        <span className="createdAtTime badge-date">
            {moment(params.data.createdByDate.slice(0, 10)).format(dateFormat)}
        </span>
    </h5>
) : (
    <NoDataCell />
);

export const UpdatedByRenderer = params => params.value ? (
    <h5 className="updateBy" title={`${params.value} • ${moment(
        params.data.updatedByDate.slice(0, 10)
    ).format(dateFormat)}`}>
        {params.value}
        <span className="updatedAtTime badge-date">
            {moment(params.data.updatedByDate.slice(0, 10)).format(dateFormat)}
        </span>
    </h5>
) : (
    <NoDataCell />
)

export const CustomLoadingOverlay = (params) => <div
    className="ag-custom-loading-cell"
    style={{ paddingLeft: '10px', lineHeight: '25px' }}
>
    <AiOutlineLoading />
    <span className="pl-2 font-size-3">{params.loadingMessage}</span>
</div>

export const CustomLoadingCellRenderer = (params) => <div
    className="ag-custom-loading-cell p-3"
>
    <AiOutlineLoading />
    <h4>{params.loadingMessage}</h4>
</div>