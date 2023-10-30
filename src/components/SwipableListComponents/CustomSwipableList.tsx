import { Checkbox, Chip, FormControlLabel, Grid, IconButton, Menu, MenuItem } from '@material-ui/core';
import { FileCopyIcon } from 'src/assets/svg/svgIcons';

import EditIcon from '@material-ui/icons/Edit';
import moment from 'moment';
import { Fragment, useEffect, useState } from 'react';
import { MdDelete } from 'react-icons/md';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAppTheme } from 'src/constants/AppConfig';
import { dateFormat } from '../../constants/helpers';
import './CustomSwipeable.scss';

//  Swipe functionalities are removed as we are facing overlap issue in mobile quote details screen
export default function CustomSwipableList({
  // columns,
  allowSelection,
  allowSwipe,
  primaryField,
  onClick,
  dataRows,
  selectedRecords,
  dispatch,
  onEdit = null,
  onDelete = null,
  extraParamsToCheckDelete,
  rowCount,
  page,
  loading,
  checkError = null,
  chips,
  permissions,
  onCreate,
  showClone,
  onClone = null,
  fullHeight = false,
  renderedFrom,
  additionalDetails = [],
  owerCollaboratorInitialsOrImages = null,
  actionCol = null,
  renderExtraChip = null,
  backgroundColorClass = null
}) {
  const [themeColor] = useAppTheme();
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuData, setMenuData] = useState({
    showClone: false,
    onClone: null,
    showEdit: false,
    onEdit: null,
    showDelete: false,
    onDelete: null
  });

  useEffect(() => {
    localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
  }, [renderedFrom]);

  const generateChipStyle = (chipColorVariable, value) => {
    if (value) {
      return {
        backgroundColor:
          themeColor === 'light'
            ? chipColorVariable[value]?.backgroundColor ?? chipColorVariable['__default__'].backgroundColor
            : 'var(--dark-secondary)',
        border: `1px solid ${
          themeColor === 'light'
            ? chipColorVariable[value]?.backgroundColor ?? chipColorVariable['__default__'].backgroundColor
            : 'var(--text-primary)'
        }`,
        color: themeColor === 'light' ? chipColorVariable[value]?.color ?? chipColorVariable['__default__'].color : 'var(--common-border-color)'
      };
    }
    return {};
  };

  return (
    <>
      {allowSelection && (
        <div className="all-check-box">
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={isAllChecked && dataRows?.every((d) => d?.isChecked === true || d?.hideSelection === true)}
                onChange={(e) => {
                  setIsAllChecked(e.target.checked);
                  const updatedMetadata = dataRows.map((d) => {
                    return { ...d, isChecked: !d.hideSelection ? e.target.checked : false };
                  });
                  dispatch({
                    type: 'selection',
                    selectedRecords: updatedMetadata.filter((d) => d.isChecked)
                  });
                  dispatch({ type: 'update', data: updatedMetadata });
                  localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(updatedMetadata.filter((d) => d.isChecked)));
                }}
                name="checkedB"
                color="primary"
              />
            }
            label="Check All"
          />
        </div>
      )}
      <div className="relative">
        {loading ? (
          <div className=" absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.54)] dark:bg-[rgba(5,9,19,0.54)] backdrop-blur-[10px]">
            <div className="bg-[white] dark:bg-[var(--dark-secondary)] px-10 py-5 rounded-lg">
              <div className="spinner"></div>
              <p className="-ml-[3px] mt-2">Loading</p>
            </div>
          </div>
        ) : null}

        <div style={{ overflowY: 'auto', height: fullHeight === true ? 'auto' : 'calc(100vh - 215px)' }} id="scrollableDiv" className="-mx-2">
          <div>
            <InfiniteScroll
              dataLength={dataRows.length}
              next={() => {
                setTimeout(() => {
                  dispatch({ type: 'pageChange', page: page + 1 });
                }, 500);
              }}
              hasMore={dataRows.length !== rowCount}
              loader={<h3 className="text-center border mt-3 p-3 loading-dots">Loading more items</h3>}
              scrollableTarget="scrollableDiv"
              endMessage={
                !loading && dataRows.length === rowCount ? (
                  <h3 className="text-center border px-3 py-2 mx-2">{'Total no. of records found ' + dataRows.length}</h3>
                ) : (
                  <></>
                )
              }
            >
              {dataRows.map((d, index) => (
                <div
                  className={`shadow-[0px_3px_26px_0px_rgba(0,0,0,0.06)] mx-2 rounded-md my-2 px-3 py-2 [--left-gutter:20px] dark:bg-[var(--dark-secondary)] ${
                    backgroundColorClass && backgroundColorClass(d) + ' td-color'
                  }`}
                  key={`${d._id}${d.isChecked || ''}`}
                  style={{ border: '1px solid var(--common-border-color)' }}
                >
                  <div className={`${checkError && checkError(d) ? 'red-data-row' : ''} flex gap-2 items-center`}>
                    {allowSelection && !d.hideSelection && (
                      <div>
                        <Checkbox
                          size="small"
                          className="p-0"
                          color="primary"
                          checked={d.isChecked}
                          onChange={(e) => {
                            dataRows[index].isChecked = e.target.checked;
                            setIsAllChecked(dataRows.every((d) => d.isChecked === true || d?.hideSelection === true));
                            dispatch({
                              type: 'selection',
                              selectedRecords: dataRows.filter((d) => d.isChecked)
                            });
                            dispatch({ type: 'update', data: dataRows });
                            localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(dataRows.filter((d) => d.isChecked)));
                          }}
                          inputProps={{ 'aria-label': 'primary checkbox' }}
                        />
                      </div>
                    )}
                    <div className="flex-grow">
                      <div className="heading-with-icon">
                        {primaryField && (
                          <h4 className="quote-name line-clamp-1">
                            <span onClick={() => onClick(d)} className="link quote-name line-clamp-1">
                              {d[primaryField.field]}
                            </span>
                          </h4>
                        )}
                        <div className="icon-layout  d-flex align-items-center gap-2">
                          {allowSwipe && permissions?.isUpdate && d.allowedToEdit && permissions?.isDelete && (
                            <>
                              {showClone && permissions?.isCreate && (
                                <IconButton
                                  size="small"
                                  className="max-w-[20px] max-h-[20px] p-[1px_!important]"
                                  aria-label="Clone"
                                  onClick={() => {
                                    onClone(d);
                                  }}
                                >
                                  <FileCopyIcon size={18} className="text-[var(--primary-text)]" />
                                </IconButton>
                              )}
                              {permissions?.isUpdate && d.allowedToEdit && onEdit && (
                                <IconButton
                                  size="small"
                                  className="max-w-[20px] max-h-[20px] p-[1px_!important]"
                                  aria-label="Edit"
                                  onClick={() => onEdit(d)}
                                >
                                  <EditIcon fontSize="small" className="text-[var(--primary-text)] w-[18px] h-[18px]" />
                                </IconButton>
                              )}
                              {extraParamsToCheckDelete && permissions?.isDelete && d.canDelete && onDelete && (
                                <IconButton size="small" aria-label="Clone" onClick={() => onDelete(d)}>
                                  <MdDelete size={18} style={{ color: 'var(--danger-light)' }} />
                                </IconButton>
                              )}
                            </>
                          )}
                          {actionCol ? actionCol(d) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="swipe-card-additional-details pl-[var(--left-gutter)]">
                    {additionalDetails.map(
                      (a, index) =>
                        d[a.field] !== null &&
                        d[a.field] !== '' &&
                        d[a.field] !== undefined && (
                          <div key={index} className="ml-2 my-1">
                            <div className="flex flex-wrap gap-1 items-center">
                              <span className="flex items-center text-[#6B6B6B] dark:text-gray-300 max-w-[15px] max-h-[15px]">{a.icon}</span>
                              <h5 className="text-truncate font-medium text-[13px] dark:text-gray-300" style={{ paddingTop: '2px', fontWeight: 500 }}>
                                {a.label ?? `${a.label || ''}`}
                                {d[a.field] ?? ''}
                              </h5>
                            </div>
                          </div>
                        )
                    )}
                  </div>

                  {chips.length > 0 && chips.some((c) => d[c.field]) && (
                    <div className="mt-1 pt-2" style={{ borderTop: '1px solid var(--common-border-color)' }}>
                      <div className=" d-flex gap-1 flex-wrap">
                        {[
                          ...chips.map((c) =>
                            c.forceShow === true || d[c.field] ? (
                              <div key={c.field}>
                                <span
                                  title={`${c.label} ${(c.fieldType === 'date' ? moment(d[c.field]).format(dateFormat) : d[c.field]) ?? ''}`}
                                  style={{ border: '1px solid #B8CCFE' }}
                                  className="rounded-full line-clamp-1 block px-3 py-[3px] font-semibold text-[12px] bg-[#F2F6FF] dark:bg-[var(--dark-primary)] dark:border-[var(--common-border-color)_!important]"
                                  key={c.field}
                                  onClick={c.onClick ? () => c.onClick(d, index) : null}
                                >{`${c.label} ${(c.fieldType === 'date' ? moment(d[c.field]).format(dateFormat) : d[c.field]) ?? ''}`}</span>
                              </div>
                            ) : (
                              <Fragment key={c.field}></Fragment>
                            )
                          )
                        ]}
                        {renderExtraChip && renderExtraChip(d, index)}
                      </div>
                    </div>
                  )}
                  {/* {owerCollaboratorInitialsOrImages && d[owerCollaboratorInitialsOrImages]?.length > 0 && (
                    <div className="avatars mt-2 pl-[var(--left-gutter)]">
                      {[...d[owerCollaboratorInitialsOrImages].slice(0, 5)].map((d, index) => (
                            <span className="avatars__item" key={index}>
                              <span className="avatar">{d.initials}</span>
                            </span>
                          ))} 

                      {d[owerCollaboratorInitialsOrImages].length > 5 && (
                        <span className="font-weight-bold bold mt-2 ml-1">+{d[owerCollaboratorInitialsOrImages].length - 5} more</span>
                      )}
                    </div>
                  )} */}
                </div>
              ))}

              <Menu
                id="menu-actions"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={() => {
                  setAnchorEl(null);
                  setMenuData({
                    showClone: false,
                    onClone: null,
                    showEdit: false,
                    onEdit: null,
                    showDelete: false,
                    onDelete: null
                  });
                }}
              >
                {menuData.showClone && (
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      menuData.onClone();
                    }}
                  >
                    Clone
                  </MenuItem>
                )}

                {menuData.showEdit && (
                  <MenuItem
                    onClick={() => {
                      menuData.onEdit();
                      setAnchorEl(null);
                    }}
                  >
                    Edit
                  </MenuItem>
                )}

                {menuData.showDelete && (
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      menuData.onDelete();
                    }}
                  >
                    Delete
                  </MenuItem>
                )}
              </Menu>
            </InfiniteScroll>
          </div>
        </div>
      </div>
    </>
  );
}
