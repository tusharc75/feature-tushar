import { camelCase, isArray, isObject } from 'lodash';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

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
  } else {
    return [];
  }
};

function DataListCell({ field, original }) {
  let joinedFieldName = field?.fieldName.indexOf(' ') > 0 ? camelCase(field?.fieldName) : field?.fieldName;

  const optionLabel = isArray(original?.[field?.fieldName])
    ? original?.[field?.fieldName][0]?.optionLabel
    : isObject(original?.[field?.fieldName])
      ? original?.[field?.fieldName]?.optionLabel
      : original?.[field?.fieldName];

  const more = isArray(original?.[field?.fieldName]) ? getMore(original?.[field?.fieldName]) : original[`rest${joinedFieldName}`];

  return (
    <div className="d-flex">
      {optionLabel ? (
        <>
          <h5 className="text-truncate" title={optionLabel}>
            {optionLabel}
          </h5>

          <span className="show-in-export">{getTitle(more)}</span>

          {more?.length > 0 && (
            <HtmlTooltip title={getTitle(more)} enterTouchDelay={0}>
              <span className="createdAtTime badge-date hide-in-export" data-hide-in-export="true">
                <span className="hidden">&nbsp;&nbsp;</span>
                {`+${more?.length} more..`}
              </span>
            </HtmlTooltip>
          )}
        </>
      ) : (
        <NoDataCell />
      )}
    </div>
  );
}

export default DataListCell;
