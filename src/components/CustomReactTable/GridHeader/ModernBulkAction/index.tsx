import { Close } from '@mui/icons-material';
import React, { useEffect } from 'react';
import { TActios, TInitialState } from 'src/components/CustomReactTable/hooks/useTableReducer';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';

type ModernBulkActionProps = {
  state: TInitialState;
  bulkActionItems: React.ReactChild;
  dispatch: React.Dispatch<TActios>;
};

const dividerClass = '[&_.divider]:w-[1px] [&_.divider]:h-[20px] [&_.divider]:mx-1 [&_.divider]:bg-[var(--common-border-color)]';

const ModernBulkAction = ({ state, bulkActionItems, dispatch }: ModernBulkActionProps) => {
  const { selectedRecords } = state;
  const handleClose = () => {
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
    <div
      className={cn(
        'flex w-full max-w-full flex-wrap items-center gap-2 rounded-md border bg-[var(--dark-secondary,#EBF0FA)] px-2 py-[6px]',
        dividerClass
      )}
    >
      {bulkActionItems}
      <div className="divider" />
      <p className="flex items-center gap-2 text-sm font-medium">
        <span className="inline-block h-[20px] rounded-full bg-blue-100 px-2 text-xs leading-[20px] text-[--primary-text] dark:bg-[var(--dark-secondary)]">
          {selectedRecords.length}
        </span>{' '}
        Selected
      </p>
      <div className="ml-auto">
        <HtmlTooltip title="Remove Selection">
          <RippleButton
            onClick={handleClose}
            className="flex items-center rounded-md px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span>Esc</span>
            <Close fontSize="small" />
          </RippleButton>
        </HtmlTooltip>
      </div>
    </div>
  );
};

export default ModernBulkAction;
