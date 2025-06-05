import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useMediaQuery } from '@mui/material';
import update from 'immutability-helper';
import { useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import {
  Action,
  FormSchema,
  InitialState,
  SetFieldValue,
  UseArrangeViewProps
} from 'src/components/CustomReactTable/ArrangeView/ArrangeViewDialog/types';
import { getCurrentColumnSizes } from 'src/components/CustomReactTable/ArrangeView/utils';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import { getStickyColumnNames } from 'src/components/CustomReactTable/utils';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const reducer = (state: InitialState, action: Action): InitialState => {
  switch (action.action) {
    case 'setLoading':
      return { ...state, loading: action.payload };
    case 'setResized':
      return { ...state, resized: action.payload };
    case 'setSearch':
      return { ...state, search: action.payload };
    case 'setSortedColumns':
      return { ...state, sortedColumns: action.payload };
    case 'setActiveItem':
      return { ...state, activeItem: action.payload };
    case 'setIsSidebarOpen':
      return { ...state, isSidebarOpen: action.payload };
    default:
      return state;
  }
};

const initialValue = {
  name: '',
  access: 'everyone',
  default: false,
  order: [],
  hide: []
};

const NOT_ALLOWED_COLUMNS = ['action', 'actions', 'expander', 'selection', 'index'];

const useArrangeView = ({
  columns,
  data,
  expander,
  getAllSavedViews,
  hideSelection,
  oldSerializedSizes,
  onClose,
  renderedFrom,
  table
}: UseArrangeViewProps) => {
  const toastConfig = useContext(CustomToastContext);
  const { stickyColumns } = useMemo(() => getStickyColumnNames({ allColumn: columns, expander, hideSelection }), [columns, expander, hideSelection]);
  const columnsWithoutSticky = useMemo<TColType[]>(
    () => columns.filter((c) => !stickyColumns.includes(c.id || c.accessor)),
    [stickyColumns, columns]
  );
  const allowedColumns = useMemo(() => {
    return columns.filter((c) => !NOT_ALLOWED_COLUMNS.includes(c.id || c.accessor));
  }, [columns]);

  const isMobile = useMediaQuery('(max-width:768px)');

  const initialState: InitialState = useMemo(
    () => ({
      loading: false,
      resized: false,
      search: '',
      sortedColumns: data?.order ? [...allowedColumns].sort((a, b) => data?.order?.indexOf(a.id) - data?.order?.indexOf(b.id)) : allowedColumns,
      activeItem: null,
      isSidebarOpen: false
    }),
    [allowedColumns, data?.order]
  );
  const defaultValue = useMemo(
    () => (data ? { name: data?.name, access: data?.access, default: data?.default, order: data?.order, hide: data?.hide } : initialValue),
    [data]
  );

  const [state, setState] = useReducer(reducer, initialState);

  const setLoading = useCallback((payload: InitialState['loading']) => {
    setState({ action: 'setLoading', payload });
  }, []);
  const setResized = useCallback((payload: InitialState['resized']) => {
    setState({ action: 'setResized', payload });
  }, []);
  const setSearch = useCallback((payload: InitialState['search']) => {
    setState({ action: 'setSearch', payload });
  }, []);
  const setSortedColumns = useCallback((payload: InitialState['sortedColumns']) => {
    setState({ action: 'setSortedColumns', payload });
  }, []);
  const setActiveItem = useCallback((payload: InitialState['activeItem']) => {
    setState({ action: 'setActiveItem', payload });
  }, []);
  const setIsSidebarOpen = useCallback((payload: InitialState['isSidebarOpen']) => {
    setState({ action: 'setIsSidebarOpen', payload });
  }, []);

  useEffect(() => {
    const newSerializedSizes = JSON.stringify(getCurrentColumnSizes(table));
    if (oldSerializedSizes.current !== newSerializedSizes) {
      setResized(true);
      oldSerializedSizes.current = newSerializedSizes;
    }
  }, [oldSerializedSizes, setResized, table]);

  // APIs
  const updateArrangeView = useCallback(
    async (values: FormSchema) => {
      const sizes = getCurrentColumnSizes(table);
      setLoading(true);
      try {
        const payload = { ...values, sizes: sizes, key: renderedFrom, _id: data._id };
        await axiosInstance().put('/user/grid-view', payload);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Updated successfully'
        });
        getAllSavedViews();
        onClose();
      } catch (error) {
        toastConfig.setToastConfig(error);
      } finally {
        setLoading(false);
      }
    },
    [data?._id, getAllSavedViews, onClose, renderedFrom, setLoading, table, toastConfig]
  );
  const saveArrangeView = useCallback(
    async (values: FormSchema) => {
      const sizes = getCurrentColumnSizes(table);
      setLoading(true);
      try {
        const payload = { ...values, sizes, key: renderedFrom };
        await axiosInstance().post('/user/grid-view', payload);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Created successfully'
        });
        getAllSavedViews();
        onClose();
      } catch (error) {
        toastConfig.setToastConfig(error);
      } finally {
        setLoading(false);
      }
    },
    [getAllSavedViews, onClose, renderedFrom, setLoading, table, toastConfig]
  );

  // DND
  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      if (!event) return;
      setActiveItem(event?.active?.data.current?.props);
    },
    [setActiveItem]
  );
  const onDragEnd = useCallback(
    (event: DragEndEvent, setFieldValue: SetFieldValue) => {
      setActiveItem(null);
      if (!event.over || event.active.id === event.over.id) return;
      const { active, over } = event;
      const dragIndex = active.data.current.index;
      const dropIndex = over.data.current.index;

      const dragCard = state.sortedColumns[dragIndex];
      const hoverCard = state.sortedColumns[dropIndex];

      if (
        NOT_ALLOWED_COLUMNS.includes(dragCard.accessor || dragCard.id) ||
        NOT_ALLOWED_COLUMNS.includes(hoverCard.accessor || hoverCard.id) ||
        dragCard?.lockPosition ||
        hoverCard?.lockPosition ||
        !!dragCard.sticky ||
        !!hoverCard.sticky
      ) {
        return;
      }

      const columnsForGrid = update(state.sortedColumns, {
        $splice: [
          [dragIndex, 1],
          [dropIndex, 0, dragCard]
        ]
      });
      setSortedColumns([...columnsForGrid]);
      setFieldValue(
        'order',
        columnsForGrid.map((c) => c.id)
      );
    },
    [setActiveItem, setSortedColumns, state.sortedColumns]
  );

  const handleReset = (setFieldValue: SetFieldValue) => {
    const visibleColumns = {};
    allowedColumns.forEach((col) => {
      visibleColumns[col.id] = true;
    });
    setSortedColumns(allowedColumns);
    setFieldValue('order', []);
    setFieldValue('hide', []);
  };
  const handleOnSubmit = useCallback(
    (formData: FormSchema) => {
      if (data) {
        updateArrangeView(formData);
      } else {
        saveArrangeView(formData);
      }
    },
    [data, saveArrangeView, updateArrangeView]
  );
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(!state.isSidebarOpen);
  }, [setIsSidebarOpen, state.isSidebarOpen]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearch(value);
    },
    [setSearch]
  );

  const filterdColumns = useMemo(() => {
    let filteredColumns: TColType[] = [];
    const searchFor = state.search.trim().toLowerCase();
    if (searchFor !== '') {
      filteredColumns = allowedColumns.filter((column) => column.Header.toLowerCase().includes(searchFor));
    } else {
      filteredColumns = allowedColumns;
    }
    return filteredColumns;
  }, [allowedColumns, state.search]);

  return {
    ...state,
    allowedColumns,
    data,
    isMobile,
    defaultValue,
    toastConfig,
    columnsWithoutSticky,
    stickyColumns,
    filterdColumns,
    // setters
    setLoading,
    setSortedColumns,
    setActiveItem,
    setIsSidebarOpen,
    // handlers
    toggleSidebar,
    handleOnSubmit,
    handleReset,
    onDragEnd,
    onDragStart,
    handleSearch
  };
};

export default useArrangeView;
