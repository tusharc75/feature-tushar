import React, { forwardRef, useImperativeHandle } from 'react';
import CustomRenderCell from '../Helpers/CustomRenderCell';
import { Link } from 'react-router-dom'
import NoDataCell from '../Helpers/NoDataCell';
import routes from '../Helpers/Routes';
import moment from 'moment';
import { AiOutlineLoading } from 'react-icons/ai';

const OptionLabelRenderer = forwardRef((params: any, ref) => {
    useImperativeHandle(ref, () => {
        return {}
    })

    return <CustomRenderCell value={params.value?.optionLabel ?? ""} />;
});

const CommonRenderer = forwardRef((params: any, ref) => {
    useImperativeHandle(ref, () => {
        return {}
    })
    return <CustomRenderCell value={params?.value} />;
});

const NameRenderer = forwardRef((params: any, ref) => {
    useImperativeHandle(ref, () => {
        return {}
    })

    return <Link className="link"
        to={`${routes.leadDetail.path}/${params.data._id}`} >
        {params?.value ?? ""}
    </Link>;
});

const RelatedOpportunityRenderer = forwardRef((params: any, ref) => {
    useImperativeHandle(ref, () => {
        return {}
    })

    return params.value ?
        <Link className="link" to={`${routes.opportunityDetail.path}/${params.data?._id}`} title={params.data?.opportunityName}>
            {params.data?.opportunityName}
        </Link>
        : <NoDataCell />
});

const CreatedByRenderer = forwardRef((params: any, ref) => {
    useImperativeHandle(ref, () => {
        return {}
    })

    return params.value && params.value.user ? (
        <h5 className="createBy">
            {params.value.user.firstName}
            <span
                className="createdAtTime badge-date"
                title={`${params.value.user.firstName} • ${moment(
                    params?.value?.date?.slice(0, 10)
                ).format("MMM Do, YYYY")}`}
            >
                {moment(params?.value?.date?.slice(0, 10)).format("MMM Do, YYYY")}
            </span>
        </h5>
    ) : (
        <NoDataCell />
    )
});


const UpdatedByRenderer = forwardRef((params: any, ref) => {
    useImperativeHandle(ref, () => {
        return {}
    })

    return params.value && params.value.user ? (
        <h5 className="updateBy">
            {params.value.user.firstName}
            <span title={params.value.date} className="updatedAtTime badge-date">
                {moment(params.value.date.slice(0, 10)).format("MMM Do, YYYY")}
            </span>
        </h5>
    ) : (
        <NoDataCell />
    )
});

const CustomLoadingOverlay = forwardRef((params: any, ref) => {
    useImperativeHandle(ref, () => {
        return {}
    })

    return <div
        className="ag-custom-loading-cell"
        style={{ paddingLeft: '10px', lineHeight: '25px' }}
    >
        <AiOutlineLoading />
        <span className="pl-2 font-size-3">{params.loadingMessage}</span>
    </div>
});

export {
    OptionLabelRenderer, CommonRenderer, NameRenderer, RelatedOpportunityRenderer,
    CreatedByRenderer, UpdatedByRenderer, CustomLoadingOverlay
}