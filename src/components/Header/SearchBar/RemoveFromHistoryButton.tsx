import { Item, SearchKeyword } from 'src/components/Header/SearchBar/types';
import useSearchHistory from 'src/components/Header/SearchBar/useSearchHistory';
import RippleButton from 'src/components/RippleButton';

const RemoveFromHistoryButton = ({ type, item }: { type: 'keyword' | 'item'; item: Item | SearchKeyword }) => {
  const { handleRemoveItemFromHistory, handleRemoveKeywordFromHistory } = useSearchHistory();

  return (
    <RippleButton
      className="link py-2 text-xs"
      onClick={(e) => {
        e.stopPropagation();
        if (type === 'item') {
          handleRemoveItemFromHistory(item as Item);
        } else {
          handleRemoveKeywordFromHistory(item as SearchKeyword);
        }
      }}
    >
      Delete
    </RippleButton>
  );
};

export default RemoveFromHistoryButton;
