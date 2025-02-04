import { Popper } from '@mui/material';
import { camelCase, isArray, isObject } from 'lodash';
import { memo, useCallback, useMemo, useState } from 'react';
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

function DropdownCellImpl({ permissions, permissionForLinks, field, original }) {
  const [anchorEl, setAnchorEl] = useState<HTMLSpanElement | HTMLDivElement | null>(null);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLSpanElement | HTMLDivElement>) => {
      event.stopPropagation();
      event.preventDefault();
      if (Boolean(anchorEl)) {
        setAnchorEl(null);
      } else {
        setAnchorEl(event.currentTarget);
      }
    },
    [anchorEl]
  );

  const handleMouseOver = useCallback((event: React.MouseEvent<HTMLSpanElement | HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback((e: React.MouseEvent<HTMLSpanElement | HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(null);
  }, []);

  const open = Boolean(anchorEl);

  let joinedFieldName = field?.fieldName.indexOf(' ') > 0 ? camelCase(field?.fieldName) : field?.fieldName;

  let pathName = useMemo(
    () =>
      routes[`${camelCase(field?.lookupResource)}Detail`]?.path
        ? routes[`${camelCase(field?.lookupResource)}Detail`]?.path
        : `/${camelCase(field?.lookupResource)}/detail`,
    [field?.lookupResource]
  );

  const optionLabel = useMemo(
    () =>
      isArray(original?.[field?.fieldName])
        ? original?.[field?.fieldName][0]?.optionLabel
        : isObject(original?.[field?.fieldName])
          ? original?.[field?.fieldName]?.optionLabel
          : original?.[field?.fieldName],
    [field?.fieldName, original]
  );

  const optionValue = useMemo(
    () =>
      isArray(original?.[field?.fieldName])
        ? original?.[field?.fieldName][0]?.optionValue
        : isObject(original?.[field?.fieldName])
          ? original?.[field?.fieldName]?.optionValue
          : original?.[`${field?.fieldName}Id`],
    [field?.fieldName, original]
  );

  const more = useMemo(
    () => (isArray(original?.[field?.fieldName]) ? getMore(original?.[field?.fieldName]) : original[`rest${joinedFieldName}`]),
    [field?.fieldName, joinedFieldName, original]
  );

  const getTitle = useCallback(
    (data, enableLink: boolean = true) => {
      if (data.length) {
        const resultComponents = [];
        const resultStrings = [];

        data.forEach((o, index) =>
          o?.optionLabel
            ? resultComponents.push(
                <ExternalLinkCell
                  key={o?.optionLabel}
                  link={o.optionValue && enableLink ? `${pathName}/${o.optionValue}` : null}
                  value={o?.optionLabel}
                  endComma={index !== data?.length - 1}
                  startComma={index === 0}
                />
              )
            : typeof o !== 'string'
              ? resultStrings.push(o, index !== data?.length - 1 ? ', ' : '')
              : ''
        );

        return [...resultComponents, resultStrings];
      }
      return '';
    },
    [pathName]
  );

  const isDataLink = useMemo(
    () => permissions[permissionForLinks[field?.lookupResource]]?.isRead || permissions[camelCase(field?.lookupResource)]?.isRead,
    [field?.lookupResource, permissionForLinks, permissions]
  );

  return (
    <div className="flex items-center">
      {optionLabel ? (
        <>
          {more?.length > 0 ? (
            <ExternalLinkCell link={null} value={optionLabel} />
          ) : (
            <ExternalLinkCell link={isDataLink ? `${pathName}/${optionValue}` : null} value={optionLabel} />
          )}
          {more?.length > 0 && (
            <>
              <span
                className="createdAtTime badge-date hide-in-export max-w-fit cursor-pointer select-none !p-[4px_6px] md:!p-[0_6px]"
                onClick={(e) => {
                  handleClick(e);
                }}
                data-hide-in-export="true"
                onMouseOver={handleMouseOver}
              >
                {`+${more?.length} more..`}
              </span>
              <span className="show-in-export">{getTitle(more, isDataLink)}</span>
              <Popper open={open} anchorEl={anchorEl} placement="top">
                <div
                  className="min-w-[100px] rounded-md bg-[var(--dark-primary,white)] p-[10px] drop-shadow-lg [border:1px_solid_var(--common-border-color)] [filter:drop-shadow(0_4px_3px_rgb(0_0_0_/_0.07))_drop-shadow(0_2px_2px_rgb(0_0_0_/_0.06))]"
                  style={{ transform: 'translateY(-11px)' }}
                  onMouseLeave={handleClose}
                >
                  <div className="relative translate-y-2 items-center text-center">
                    <div className=" max-h-[200px] min-w-[100px] space-y-1 overflow-y-auto overflow-x-hidden">
                      <ExternalLinkCell link={isDataLink ? `${pathName}/${optionValue}` : null} value={optionLabel} />
                      {getTitle(more, isDataLink)}
                    </div>
                    <div className="filler absolute -bottom-[43px] -left-[10px] -right-[10px] h-[48px] cursor-help"></div>
                    <IoCaretDown
                      size={24}
                      className="absolute -bottom-[26px] left-0 right-0 z-10 mx-auto !stroke-[var(--common-border-color)] text-[var(--dark-primary,white)] "
                    />
                  </div>
                </div>
              </Popper>
            </>
          )}
        </>
      ) : (
        <NoDataCell />
      )}
    </div>
  );
}
const DropdownCell = memo(DropdownCellImpl);

export default DropdownCell;
