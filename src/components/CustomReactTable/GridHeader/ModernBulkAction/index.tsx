import { Close } from '@mui/icons-material';
import React, { useEffect } from 'react';
import { ExtendedTInitialState, TActios, TInitialState } from 'src/components/CustomReactTable/hooks/useTableReducer';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';

type ModernBulkActionProps = {
  state: ExtendedTInitialState;
  bulkActionItems: React.ReactChild;
  dispatch: React.Dispatch<TActios>;
  onClose?: () => void;
};

const dividerClass = '[&_.divider]:w-[1px] [&_.divider]:h-[20px] [&_.divider]:mx-1 [&_.divider]:bg-[var(--common-border-color)]';

const ModernBulkAction = ({ state, bulkActionItems, dispatch, onClose }: ModernBulkActionProps) => {
  const { selectedRecords, selectedCustomSubRows } = state;
  const handleClose = () => {
    if (!!onClose && typeof onClose === 'function') {
      onClose?.();
    }
    dispatch({ type: 'selection', selectedRecords: [] });
  };

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  return (
    <div className={cn('flex w-full max-w-full items-center gap-2 rounded-md border bg-[var(--dark-secondary,#EBF0FA)] px-2 py-[6px]', dividerClass)}>
      {bulkActionItems}

      <div className="ml-auto  ">
        <HtmlTooltip title="Remove Selection">
          <RippleButton
            onClick={handleClose}
            className="flex items-center rounded-full border bg-[var(--dark-primary,white)] px-2 py-1 text-sm font-medium text-red-500 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <p className="flex items-center gap-1 pl-1 pr-2 text-[13px] text-gray-500 dark:text-gray-300">
              <span>{selectedRecords.length || selectedCustomSubRows.length}</span>
              Selected
            </p>
            <span className="max-md:sr-only">Esc</span>
            <Close fontSize="small" color="error" />
          </RippleButton>
        </HtmlTooltip>
      </div>
    </div>
  );
};

export default ModernBulkAction;
