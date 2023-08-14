import { useState, useEffect, Fragment } from 'react';
import { Grid, Checkbox, FormControlLabel, Fab, Chip, Tooltip, Menu, MenuItem, IconButton } from '@material-ui/core';
import InfiniteScroll from 'react-infinite-scroll-component';
import { isMobile } from 'react-device-detect';
import AddIcon from '@material-ui/icons/Add';
import { dateFormat } from '../../constants/helpers';
import moment from 'moment';
import { BiEdit } from 'react-icons/bi';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { MdAccountCircle, MdDelete, MdEdit } from 'react-icons/md';
import { FaCopy, FaSuitcase } from 'react-icons/all';
import { useAppTheme } from 'src/constants/AppConfig';
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
  onEdit,
  onDelete,
  extraParamsToCheckDelete,
  rowCount,
  page,
  loading,
  checkError = null,
  chips,
  permissions,
  onCreate,
  showClone,
  onClone,
  fullHeight = false,
  renderedFrom,
  additionalDetails = [],
  owerCollaboratorInitialsOrImages = null
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
  }, []);

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
        <Grid container>
          <Grid item xs={12} sm={12} className="border-bottom all-check-box">
            <FormControlLabel
              control={
                <Checkbox
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
          </Grid>
        </Grid>
      )}
      <div
        style={{ overflowY: 'auto', height: fullHeight === true ? 'auto' : 'calc(100vh - 215px)', backgroundColor: 'var(--dark-secondary, #F5F7F9)' }}
        id="scrollableDiv"
      >
        <div>
          <InfiniteScroll
            dataLength={dataRows.length}
            // height="400px"
            next={() => {
              setTimeout(() => {
                dispatch({ type: 'pageChange', page: page + 1 });
              }, 500);
            }}
            hasMore={dataRows.length !== rowCount}
            loader={<h3 className="text-center border mt-3 p-3 loading-dots">Loading more items</h3>}
            scrollableTarget="scrollableDiv"
            endMessage={
              loading == false && dataRows.length === rowCount ? (
                <h3 className="text-center border p-3">{'Total no. of records found ' + dataRows.length}</h3>
              ) : (
                <></>
              )
            }
          >
            {/* {loading ? (
             <Grid container alignItems="center" justifyContent="center" style={{minHeight:"20vh"}}>
                <div className="spinner"></div>
                </Grid>
            ) : ( */}
            {dataRows.map((d, index) => (
              <Grid
                key={d._id}
                container
                className={`py-2 border-bottom card-shadow mt-2 mb-2 ${index === 0 ? 'mt-1 mb-1' : ''} ${
                  checkError && checkError(d) ? 'red-data-row' : ''
                }`}
              >
                {allowSelection && !d.hideSelection && (
                  <Grid item xs={1} sm={1}>
                    <Checkbox
                      className="pt-0"
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
                  </Grid>
                )}
                <Grid item xs={11} sm={11} className="pl-2">
                  <div className="heading-with-icon">
                    {primaryField && (
                      <h4 className="ml-2 quote-name text-truncate">
                        <span onClick={() => onClick(d)} className="link quote-name text-truncate">
                          {d[primaryField.field]}
                        </span>
                      </h4>
                    )}
                    {allowSwipe && permissions?.isUpdate && d.allowedToEdit && permissions?.isDelete && (
                      <div className="icon-layout mr-2 d-flex align-items-center gap-1">
                        {showClone && permissions?.isCreate && (
                          <IconButton
                            size="small"
                            aria-label="Clone"
                            onClick={() => {
                              onClone(d);
                            }}
                          >
                            <FileCopyIcon fontSize="small" color="primary" />
                          </IconButton>
                        )}
                        {permissions?.isUpdate && d.allowedToEdit && (
                          <BiEdit size={20} onClick={() => onEdit(d)} style={{ color: 'var(--primary-text)' }} />
                        )}
                        {extraParamsToCheckDelete && permissions?.isDelete && d.canDelete && (
                          <MdDelete size={20} onClick={() => onDelete(d)} style={{ color: 'var(--danger-light)' }} />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="swipe-card-additional-details">
                    {additionalDetails.map(
                      (a, index) =>
                        d[a.field] !== null &&
                        d[a.field] !== '' &&
                        d[a.field] !== undefined && (
                          <div key={index} className="ml-2 my-1">
                            <div className="swipe-card-additional-details-inner">
                              <span style={{ color: '#337FFB' }} className="d-flex align-items-center">
                                {a.icon}
                              </span>
                              <h5 className="text-truncate" style={{ paddingTop: '2px', fontWeight: 500 }}>
                                {d[a.field]}
                              </h5>
                            </div>
                          </div>
                        )
                    )}
                  </div>
                  {chips.length > 0 && (
                    <div className="d-flex gap-2 mt-1 mb-1 flex-wrap ml-2">
                      {[
                        ...chips.map((c) =>
                          c.forceShow === true || d[c.field] ? (
                            <Chip
                              className="overflow-hidden "
                              key={c.field}
                              onClick={c.onClick ? () => c.onClick(d, index) : null}
                              size="small"
                              icon={c.icon}
                              color={c.color}
                              label={`${c.label} ${(c.fieldType === 'date' ? moment(d[c.field]).format(dateFormat) : d[c.field]) ?? ''}`}
                              style={
                                c.setBackground && c.setBackground(d)
                                  ? c.setBackground(d)
                                  : c.chipColorVariable
                                  ? generateChipStyle(c.chipColorVariable, d[c.field]?.toLowerCase())
                                  : {}
                              }
                            />
                          ) : (
                            <Fragment key={c.field}></Fragment>
                          )
                        )
                      ]}
                    </div>
                  )}
                  {owerCollaboratorInitialsOrImages && d[owerCollaboratorInitialsOrImages]?.length > 0 && (
                    <div className="avatars ml-2 mt-2">
                      {[...d[owerCollaboratorInitialsOrImages].slice(0, 5)].map((d, index) => (
                        <span className="avatars__item" key={index}>
                          <span className="avatar">{d.initials}</span>
                        </span>
                      ))}

                      {d[owerCollaboratorInitialsOrImages].length > 5 && (
                        <span className="font-weight-bold bold mt-2 ml-1">+{d[owerCollaboratorInitialsOrImages].length - 5} more</span>
                      )}
                    </div>
                  )}
                </Grid>
              </Grid>
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

      {/* {permissions?.isCreate && isMobile && onCreate && (
        <Tooltip title="Create">
          <Fab size="small" onClick={onCreate} className="fab-position-b-r" color="primary" aria-label="add">
            <AddIcon />
          </Fab>
        </Tooltip>
      )} */}
    </>
  );
}
