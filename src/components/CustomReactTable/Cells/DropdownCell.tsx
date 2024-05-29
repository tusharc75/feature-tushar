import { Popover } from '@material-ui/core';
import { camelCase, isArray, isObject } from 'lodash';
import { useState } from 'react';
import { IoCaretDown } from 'react-icons/io5';
import { ExternalLinkCell } from 'src/components/CustomReactTable/Cells/ExternalLinkCell';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';

const getMore = (data) => {
  if (data?.length > 1) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_first, ...rest] = data;
    return rest;
  } else {
    return [];
  }
};

function DropdownCell({ permissions, permissionForLinks, field, original }) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  let joinedFieldName = field?.fieldName.indexOf(' ') > 0 ? camelCase(field?.fieldName) : field?.fieldName;

  let pathName = routes[`${camelCase(field?.lookupResource)}Detail`]?.path
    ? routes[`${camelCase(field?.lookupResource)}Detail`]?.path
    : `/${camelCase(field?.lookupResource)}/detail`;

  const optionLabel = isArray(original?.[field?.fieldName])
    ? original?.[field?.fieldName][0]?.optionLabel
    : isObject(original?.[field?.fieldName])
      ? original?.[field?.fieldName]?.optionLabel
      : original?.[field?.fieldName];

  const optionValue = isArray(original?.[field?.fieldName])
    ? original?.[field?.fieldName][0]?.optionValue
    : isObject(original?.[field?.fieldName])
      ? original?.[field?.fieldName]?.optionValue
      : original?.[`${field?.fieldName}Id`];

  const more = isArray(original?.[field?.fieldName]) ? getMore(original?.[field?.fieldName]) : original[`rest${joinedFieldName}`];

  const getTitle = (data, enableLink: boolean = true) => {
    if (data.length) {
      const resultComponents = [];
      const resultStrings = [];

      data.forEach((o) =>
        o?.optionLabel
          ? resultComponents.push(
              <ExternalLinkCell
                key={o?.optionLabel}
                link={o.optionValue && enableLink ? `${pathName}/${o.optionValue}` : null}
                value={o?.optionLabel}
              />
            )
          : typeof o !== 'string'
            ? resultStrings.push(o)
            : ''
      );

      return [...resultComponents, resultStrings.join(' ')];
    }
    return '';
  };

  const isDataLink = permissions[permissionForLinks[field?.lookupResource]]?.isRead || permissions[camelCase(field?.lookupResource)]?.isRead;

  return (
    <div>
      {optionLabel ? (
        <>
          {more?.length > 0 ? (
            <ExternalLinkCell link={null} value={optionLabel} />
          ) : (
            <ExternalLinkCell link={isDataLink ? `${pathName}/${optionValue}` : null} value={optionLabel} />
          )}
          {more?.length > 0 && (
            <>
              <span className="createdAtTime badge-date cursor-pointer" onClick={handleClick}>
                <span className="hidden">&nbsp;&nbsp;</span>
                {`+${more?.length} more..`}
              </span>
              <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'center'
                }}
                transformOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center'
                }}
                PaperProps={{
                  style: {
                    overflow: 'initial',
                    padding: '10px 10px',
                    transform: 'translateY(-11px)',
                    minWidth: 100
                  },
                  onMouseLeave: handleClose
                }}
              >
                <div className="relative translate-y-2 items-center text-center">
                  <div className=" max-h-[200px] min-w-[100px] space-y-1 overflow-y-auto overflow-x-hidden">
                    <ExternalLinkCell link={isDataLink ? `${pathName}/${optionValue}` : null} value={optionLabel} />
                    {getTitle(more, isDataLink)}
                  </div>
                  <div className="filler absolute -bottom-[26px] -left-[10px] -right-[10px] h-[28px] "></div>
                  <IoCaretDown size={24} className="absolute -bottom-[26px] left-0 right-0 z-10 mx-auto text-[var(--dark-primary,white)]" />
                </div>
              </Popover>
            </>
          )}
        </>
      ) : (
        <NoDataCell />
      )}
    </div>
  );
}

export default DropdownCell;
