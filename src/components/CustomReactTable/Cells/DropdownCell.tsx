import { camelCase, isArray, isObject } from "lodash";
import NoDataCell from "src/components/Helpers/NoDataCell";
import routes from "src/components/Helpers/Routes";
import { Link } from 'react-router-dom';
import HtmlTooltip from "src/components/CustomTooltipTitle";

const getTitle = (data) => {
    if (data.length) {
        let restParams = data.map((o) => (o?.optionLabel ? o?.optionLabel : typeof o !== 'object' ? o : '')).join(', ');
        return restParams;
    }
    return '';
};

const getMore = (data) => {
    if (data?.length > 1) {
        const [first, ...rest] = data;
        return rest;
    }
    else {
        return []
    }
}

function DropdownCell({ permissions, permissionForLinks, field, original }) {

    let joinedFieldName = field?.fieldName.indexOf(' ') > 0 ? camelCase(field?.fieldName) : field?.fieldName;

    let pathName = routes[`${camelCase(field?.lookupResource)}Detail`]?.path
        ? routes[`${camelCase(field?.lookupResource)}Detail`]?.path
        : `/${camelCase(field?.lookupResource)}/detail`;

    const optionLabel = isArray(original?.[field?.fieldName]) ? original?.[field?.fieldName][0]?.optionLabel :
        isObject(original?.[field?.fieldName]) ? original?.[field?.fieldName]?.optionLabel : original?.[field?.fieldName]

    const optionValue = isArray(original?.[field?.fieldName]) ? original?.[field?.fieldName][0]?.optionValue :
        isObject(original?.[field?.fieldName]) ? original?.[field?.fieldName]?.optionValue : original?.[`${field?.fieldName}Id`]

    const more = isArray(original?.[field?.fieldName]) ? getMore(original?.[field?.fieldName]) : original[`rest${joinedFieldName}`]

    return (
        <div>
            {optionLabel ? (
                <>
                    {permissions[permissionForLinks[field?.lookupResource]]?.isRead || permissions[camelCase(field?.lookupResource)]?.isRead ?
                        <Link
                            className="link text-truncate"
                            title={optionLabel}
                            to={`${pathName}/${optionValue}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {optionLabel}
                        </Link>
                        :
                        <h5 className="text-truncate" title={optionLabel}>
                            {optionLabel}
                        </h5>
                    }
                    {more?.length > 0 && (
                        <HtmlTooltip title={getTitle(more)} enterTouchDelay={0}>
                            <span className="createdAtTime badge-date">{`+${more?.length} more..`}</span>
                        </HtmlTooltip>
                    )}
                </>
            ) : (
                <NoDataCell />
            )}
        </div>
    )
}


export default DropdownCell