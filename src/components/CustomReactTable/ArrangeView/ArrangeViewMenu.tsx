import { Divider, Fade, IconButton, List, ListItem, Popper } from '@material-ui/core';
import { Delete, Edit, SwapHoriz } from '@material-ui/icons';
import React, { Dispatch, Fragment, useCallback, useContext, useMemo, useState } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { ImSpinner2 } from 'react-icons/im';
import axiosInstance from 'src/axios/axiosInstance';
import { getLocalGridMetaData, removeLocalSelectedViewId, setLocalGridMetaData } from 'src/components/CustomReactTable/ArrangeView/utils';
import { TActios, TInitialState } from 'src/components/CustomReactTable/hooks/useTableReducer';
import { getStickyColumnNames } from 'src/components/CustomReactTable/utils';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from '../../Helpers/ConfirmationDialog';
import EditCreateViewDialog from 'src/components/CustomReactTable/ArrangeView/EditCreateViewDialog';

export type SavedData = {
  _id: string;
  name: string;
  access: string;
  key: string;
  hide: string[];
  order: string[];
  brand: string;
  user: string;
  createdBy: CreatedBy;
  default: boolean;
};

export type CreatedBy = {
  user: string;
  date: Date;
};

type ArrangeViewMenuProps = {
  renderedFrom: string;
  dispatch: Dispatch<TActios>;
  state: TInitialState;
  columns: any[];
  hideSelection: boolean;
  expander: boolean;
};
const ArrangeViewMenu = ({ renderedFrom, dispatch, state, columns, hideSelection, expander }: ArrangeViewMenuProps) => {
  const { loading } = state;
  const toastConfig = useContext(CustomToastContext);
  const [savedData, setSavedData] = useState<SavedData[]>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [arrowRef, setArrowRef] = React.useState<HTMLElement | null>(null);
  const [selectedViewId, setSelectedViewId] = useState<string>(null);
  const [editCreateDialogData, setEditCreateDialogData] = useState<{ open: boolean; data: SavedData | null }>({ open: false, data: null });
  const [confirmationDialog, setConfirmationDialog] = useState<{ open: boolean; data: SavedData | null }>({ open: false, data: null });

  const stickycolumns = useMemo(
    () => getStickyColumnNames({ allColumn: columns, hideSelection, expander: expander }),
    [columns, expander, hideSelection]
  );

  const getAllSavedViews = useCallback(async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get('/user/grid-view');
      setSavedData(data.filter((d) => d.key === renderedFrom));
      const { selectedViews } = getLocalGridMetaData();
      setSelectedViewId(selectedViews[renderedFrom]);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  }, [renderedFrom, toastConfig]);

  const applyView = (data: SavedData) => {
    setLocalGridMetaData({ [renderedFrom]: { hide: data.hide, order: data.order } }, data._id);
    applyViewInTable(data.order, data.hide);
    getAllSavedViews();
  };

  const applyViewInTable = (order: string[], hide: string[]) => {
    let columnOrder = [];
    const columnHiddenStateData = {};
    columns.forEach((column) => {
      columnHiddenStateData[column.id] = !hide.includes(column.id);
    });
    if (order.length > 0) {
      columnOrder = [...stickycolumns.left, ...order, ...stickycolumns.right];
    } else {
      columnOrder = [...stickycolumns.left, ...columns.map((c) => c.id), ...stickycolumns.right];
    }
    dispatch({ type: 'setVisibleColumns', visibleColumns: columnHiddenStateData });
    dispatch({ type: 'setColumnOrder', columnOrder: columnOrder });
  };

  const deleteView = async (data: SavedData) => {
    if (!data) return;
    try {
      await axiosInstance().put('/user/grid-view/remove', { ids: [data._id] });
      getAllSavedViews();
      setConfirmationDialog({ open: false, data: null });
      if (selectedViewId === data._id) {
        removeLocalSelectedViewId(data._id, renderedFrom);
        applyViewInTable([], []);
      }
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Deleted successfully'
      });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const openEditModal = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, data: SavedData) => {
    e.preventDefault();
    e.stopPropagation();
    setEditCreateDialogData({ open: true, data: data });
  };
  const openCreateEditModal = () => {
    setEditCreateDialogData({ open: true, data: null });
  };

  const closeEditCreateModal = () => {
    setEditCreateDialogData({ open: false, data: null });
  };

  const openDeleteConfirmationModal = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, data: SavedData) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(null);
    setConfirmationDialog({ open: true, data: data });
  };

  return (
    <>
      <HtmlTooltip title="Arrange View" placement="top" arrow>
        <IconButton
          aria-describedby="columnSelection"
          size="small"
          color="primary"
          disabled={loading}
          className="refresh-arrange-button"
          onClick={(e) => {
            getAllSavedViews();
            setAnchorEl(e.currentTarget);
          }}
        >
          <SwapHoriz />
        </IconButton>
      </HtmlTooltip>
      <Popper
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        keepMounted={false}
        transition
        placement="bottom"
        modifiers={{
          flip: {
            enabled: true
          },
          preventOverflow: {
            enabled: true,
            boundariesElement: 'scrollParent'
          },
          arrow: {
            enabled: true,
            element: arrowRef
          }
        }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350} in={Boolean(anchorEl)}>
            <>
              <span ref={setArrowRef} className="popper-arrow"></span>
              <div className="mt-[10px] min-w-[400px] max-w-[400px] rounded-md bg-[var(--dark-primary,white)] shadow-lg [border:1px_solid_var(--common-border-color)] ">
                <ClickAwayListener
                  onClickAway={() => {
                    setAnchorEl(null);
                  }}
                >
                  <div className="body">
                    <div className="head p-2 text-center [border-bottom:1px_solid_var(--common-border-color)]">
                      <h5 className="bold text-lg">Views</h5>
                    </div>
                    <div className="content p-3 ">
                      {!savedData ? (
                        <div className="relative flex min-h-[60px]">
                          <ImSpinner2 className="absolute inset-0 m-auto animate-spin" size={50} />
                        </div>
                      ) : (
                        <div>
                          <List>
                            {savedData.length > 0 ? (
                              savedData.map((d, i) => {
                                return (
                                  <Fragment key={d._id}>
                                    {i !== 0 && <Divider />}
                                    <ListItem
                                      button
                                      selected={selectedViewId === d._id}
                                      key={d._id}
                                      component={'li'}
                                      onClick={() => {
                                        setAnchorEl(null);
                                        applyView(d);
                                      }}
                                    >
                                      <div className="flex w-full justify-between gap-2">
                                        <span>{d.name}</span>
                                        <div className="span">
                                          <IconButton size={'small'} onClick={(e) => openEditModal(e, d)}>
                                            <Edit fontSize="small" />
                                          </IconButton>
                                          <IconButton size={'small'} onClick={(e) => openDeleteConfirmationModal(e, d)}>
                                            <Delete fontSize="small" color="error" />
                                          </IconButton>
                                        </div>
                                      </div>
                                    </ListItem>
                                  </Fragment>
                                );
                              })
                            ) : (
                              <>
                                <p className="select-none text-center text-3xl font-semibold text-gray-300">No views found.</p>
                                <p className="text-md select-none text-center text-gray-300">Please create a view first.</p>
                              </>
                            )}
                          </List>
                        </div>
                      )}
                    </div>
                    <div className="footer mt-2 flex justify-end gap-2 p-2 [border-top:1px_solid_var(--common-border-color)]">
                      <ThemeButton borderColor="none" color="primary" iconForMobile={false} onClick={openCreateEditModal}>
                        Create view
                      </ThemeButton>
                    </div>
                  </div>
                </ClickAwayListener>
              </div>
            </>
          </Fade>
        )}
      </Popper>

      {editCreateDialogData.open && (
        <EditCreateViewDialog
          onClose={closeEditCreateModal}
          renderedFrom={renderedFrom}
          data={editCreateDialogData.data}
          getAllSavedViews={getAllSavedViews}
          columns={columns}
          hideSelection={hideSelection}
          expander={expander}
        />
      )}

      {confirmationDialog.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete ?`}
          onClose={() => setConfirmationDialog({ open: false, data: null })}
          onOk={() => {
            deleteView(confirmationDialog.data);
          }}
        />
      )}
    </>
  );
};

export default ArrangeViewMenu;
