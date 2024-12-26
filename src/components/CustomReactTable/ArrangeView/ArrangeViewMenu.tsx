import { Divider, IconButton, List, ListItem, Menu } from '@mui/material';
import { Delete, Edit, SwapHoriz } from '@mui/icons-material';
import React, { Dispatch, Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FaStar } from 'react-icons/fa6';
import { ImSpinner2 } from 'react-icons/im';
import axiosInstance from 'src/axios/axiosInstance';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';
import ArrangeViewDialog from 'src/components/CustomReactTable/ArrangeView/ArrangeViewDialog';
import { getCurrentColumnSizes, useGridMetaData } from 'src/components/CustomReactTable/ArrangeView/utils';
import { TActios, TInitialState } from 'src/components/CustomReactTable/hooks/useTableReducer';
import { getStickyColumnNames } from 'src/components/CustomReactTable/utils';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { SET_USER } from 'src/StateProvider/actionTypes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import ConfirmationDialog from '../../Helpers/ConfirmationDialog';
import { Table } from '@tanstack/react-table';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';

export type GridViewSavedData = {
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
  sizes: { [key: string]: number };
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
  appliedView?: { hide: string[]; order: string[]; sizes: { [key: string]: number }; name?: string; id?: string };
  table: Table<any>;
};

const ArrangeViewMenu = ({ renderedFrom, dispatch, state, columns, hideSelection, expander, appliedView, table }: ArrangeViewMenuProps) => {
  const oldSerializedSizes = useRef(JSON.stringify(getCurrentColumnSizes(table)));
  const walkmeInstance = useGetWalkmeInstance();

  const { loading } = state;

  const { gridMetaData, setGridMetaData } = useGridMetaData();
  const { isOffline } = useContext(CustomOfflineContext);

  const {
    state: { user },
    dispatch: contextDispatch
  }: any = useData();

  const contextGridViews = useMemo(() => (user?.gridViews || []) as GridViewSavedData[], [user?.gridViews]);

  const savedDataForThisGrid = useMemo(() => contextGridViews.filter((d) => d.key === renderedFrom), [contextGridViews, renderedFrom]);
  const defaultView = useMemo(() => savedDataForThisGrid.find((d) => d.default), [savedDataForThisGrid]);

  const toastConfig = useContext(CustomToastContext);
  const [savedData, setSavedData] = useState<GridViewSavedData[]>(savedDataForThisGrid);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editCreateDialogData, setEditCreateDialogData] = useState<{ open: boolean; data: GridViewSavedData | null }>({ open: false, data: null });
  const [confirmationDialog, setConfirmationDialog] = useState<{ open: boolean; data: GridViewSavedData | null }>({ open: false, data: null });
  const [selected, setSelected] = useState(appliedView ? { ...appliedView, _id: appliedView.id } : defaultView);

  const applyViewInTable = (order: string[], hide: string[], sizes: { [key: string]: number } | null, name?: string, id?: string) => {
    const stickycolumns = getStickyColumnNames({ allColumn: columns, hideSelection, expander: expander });
    let columnOrder = [];
    const columnHiddenStateData = {};
    columns.forEach((column) => {
      columnHiddenStateData[column.id] = !hide.includes(column.id);
    });
    if (order.length > 0) {
      // This line ensures that the action column does not move left, if the order was saved previously and new columns have been added since then.
      const restOfTheColumns = columns.map((d) => d.id).filter((d) => !order.includes(d));

      const newOrder = order.filter((d) => !stickycolumns.stickyColumns.includes(d));
      columnOrder = [...stickycolumns.left, ...newOrder, ...restOfTheColumns, ...stickycolumns.right];
    } else {
      const columnsWithoutSticky = columns.filter((d) => !stickycolumns.stickyColumns.includes(d.id)).map((c) => c.id);
      columnOrder = [...stickycolumns.left, ...columnsWithoutSticky, ...stickycolumns.right];
    }

    dispatch({ type: 'setVisibleColumns', visibleColumns: columnHiddenStateData });
    dispatch({ type: 'setColumnOrder', columnOrder: columnOrder });
    dispatch({ type: 'setColumnSizes', sizes: sizes });

    const newData = {
      ...gridMetaData,
      [renderedFrom]: { hide, order, name, id }
    };

    setGridMetaData(newData);
  };

  useEffect(() => {
    if (appliedView) {
      applyViewInTable(appliedView.order, appliedView.hide, appliedView.sizes, appliedView.name, appliedView.id);
    } else if (defaultView) {
      applyViewInTable(defaultView?.order || [], defaultView?.hide || [], defaultView.sizes || null, defaultView.name, defaultView._id);
    } else {
      applyViewInTable([], [], null);
    }
  }, [renderedFrom, columns.length]);

  const getAllSavedViews = useCallback(async () => {
    const sizes = getCurrentColumnSizes(table);
    try {
      const {
        data: { data }
      } = await axiosInstance().get('/user/grid-view');
      setSavedData(data.filter((d) => d.key === renderedFrom));
      contextDispatch({ type: SET_USER, payload: { ...user, sizes, gridViews: data } });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  }, [renderedFrom, toastConfig, contextDispatch, user]);

  const applyView = (data: GridViewSavedData) => {
    applyViewInTable(data.order, data.hide, data.sizes, data.name, data._id);
    setSelected(data);
  };

  const deleteView = async (data: GridViewSavedData) => {
    if (!data) return;
    try {
      await axiosInstance().put('/user/grid-view/remove', { ids: [data._id] });
      getAllSavedViews();
      setConfirmationDialog({ open: false, data: null });
      if (selected._id === data._id) {
        applyViewInTable([], [], null);
        setSelected(null);
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

  const openEditModal = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, data: GridViewSavedData) => {
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

  const openDeleteConfirmationModal = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, data: GridViewSavedData) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(null);
    setConfirmationDialog({ open: true, data: data });
  };

  return (
    <>
      {!isOffline && (
        <HtmlTooltip title="Arrange View" placement="top" arrow>
          <IconButton
            aria-describedby="columnSelection"
            size="small"
            color="primary"
            disabled={loading}
            className="refresh-arrange-button"
            onClick={(e) => {
              setAnchorEl(e.currentTarget);
            }}
          >
            <SwapHoriz />
          </IconButton>
        </HtmlTooltip>
      )}
      <Menu
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        keepMounted={false}
        transitionDuration={walkmeInstance ? 0 : 250}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        PaperProps={{
          className: '!rounded-md !shadow-lg [border:1px_solid_var(--common-border-color)] '
        }}
        MenuListProps={{
          className: '!p-0 min-w-[min(400px,calc(100vw-40px))] max-w-[400px] '
        }}
      >
        <div>
          <div className="body">
            <div className="head p-2 text-center [border-bottom:1px_solid_var(--common-border-color)]">
              <h5 className="bold text-lg">Views</h5>
            </div>
            <div className="content max-h-[350px] overflow-auto p-3">
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
                              key={d._id}
                              component={'li'}
                              selected={selected?._id === d._id}
                              onClick={() => {
                                setAnchorEl(null);
                                applyView(d);
                              }}
                            >
                              <div className="flex  w-full justify-between gap-2">
                                <span className=" flex items-center gap-1">
                                  <span className="line-clamp-1 ">{d.name}</span>
                                  {defaultView?._id === d._id && (
                                    <>
                                      <HtmlTooltip title="Default view">
                                        <FaStar size={10} className="text-[var(--new-theme-color)]" />
                                      </HtmlTooltip>
                                      {/* <span className="block flex-shrink-0 text-[10px] text-gray-400">(default view)</span> */}
                                    </>
                                  )}
                                </span>
                                <div className="flex cursor-auto gap-2">
                                  <HtmlTooltip title={d?.user === user?.user?._id ? 'Edit' : 'You have not permission to edit'}>
                                    <IconButton
                                      size={'small'}
                                      disabled={d?.user === user?.user?._id ? false : true}
                                      onClick={(e) => openEditModal(e, d)}
                                    >
                                      <Edit fontSize="small" color={d?.user === user?.user?._id ? 'primary' : 'disabled'} />
                                    </IconButton>
                                  </HtmlTooltip>
                                  <HtmlTooltip title={d?.user === user?.user?._id ? 'Delete' : 'You have not permission to delete'}>
                                    <IconButton
                                      size={'small'}
                                      disabled={d?.user === user?.user?._id ? false : true}
                                      onClick={(e) => openDeleteConfirmationModal(e, d)}
                                    >
                                      <Delete fontSize="small" color={d?.user === user?.user?._id ? 'error' : 'disabled'} />
                                    </IconButton>
                                  </HtmlTooltip>
                                </div>
                              </div>
                            </ListItem>
                          </Fragment>
                        );
                      })
                    ) : (
                      <>
                        <p className="text-md select-none text-center text-gray-400 dark:text-gray-700">No views found.</p>
                        <p className="select-none text-center text-sm text-gray-400 dark:text-gray-700">Please create a view first.</p>
                      </>
                    )}
                  </List>
                </div>
              )}
            </div>
            <div className="footer mt-2 flex justify-end gap-2 p-2 [border-top:1px_solid_var(--common-border-color)]">
              <ThemeButton
                iconForMobile={false}
                onClick={() => {
                  setAnchorEl(null);
                  applyViewInTable([], [], null);
                  setSelected(null);
                }}
              >
                Reset
              </ThemeButton>
              <ThemeButton borderColor="none" color="primary" iconForMobile={false} onClick={openCreateEditModal}>
                Create view
              </ThemeButton>
            </div>
          </div>
        </div>
      </Menu>
      {editCreateDialogData.open && (
        <ArrangeViewDialog
          onClose={closeEditCreateModal}
          renderedFrom={renderedFrom}
          data={editCreateDialogData.data}
          getAllSavedViews={getAllSavedViews}
          columns={columns}
          hideSelection={hideSelection}
          expander={expander}
          table={table}
          oldSerializedSizes={oldSerializedSizes}
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
