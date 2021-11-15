import React from "react";
import moment from "moment";
import { AiOutlineLoading } from "react-icons/ai";
import CustomRenderCell from "../Helpers/CustomRenderCell";
import NoDataCell from "../Helpers/NoDataCell";
import { dateFormat } from "../../constants/helpers"
import Avatar from "@material-ui/core/Avatar"
import Tooltip from "@material-ui/core/Tooltip"
import { Link } from 'react-router-dom'

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

export const DateRenderer = params => params.value ? (
    <h5 className="createBy" title={`${moment(
        params.value.slice(0, 10)
    ).format(dateFormat)}`}>
        {moment(params.value.slice(0, 10)).format(dateFormat)}
    </h5>
) : (
    <NoDataCell />
);
export const CheckboxRenderer = params => (
    <span>
        {Boolean(params?.value) ? "Yes" : "No"}
    </span>
)

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

const getTitle = data => {
    if (data.length) {
        let restParams = data.map(o => o?.optionLabel ? o?.optionLabel : typeof o !== "object" ? o : "").join(", ")
        return restParams
    }
    return ""
}
export const LinkRenderer = params => params.value ? (
    <>
        <Link className="link text-truncate" to={params?.isForPopup ? `${params?.pathName}?id=${params?.data[params?.property]}` :
            `${params?.pathName}/${params?.data[params?.property]}`} title={params?.value}>{params?.value}</Link>

        {
            params["more"] && params.data[params["more"]]?.length > 0 && (
                <Tooltip title={getTitle(params.data[params["more"]])} >
                    <span className="createdAtTime badge-date">{`+${params.data[params["more"]].length} more..`}</span>
                </Tooltip>

            )
        }
    </>
) : (
    <NoDataCell />
)

export const NameRenderer = params => params.value ? (
    <Link className="link"
        to={`${params?.pathName}/${params?.data?._id}`} title={params?.value}>{params?.value}</Link>
) : (
    <NoDataCell />
)

export const ImageRenderer = params => (
    <Avatar className="grid-avatar" src={params?.value} />
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
