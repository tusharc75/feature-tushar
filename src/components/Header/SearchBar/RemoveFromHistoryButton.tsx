import { Item, SearchKeyword } from 'src/components/Header/SearchBar/types';
import RippleButton from 'src/components/RippleButton';

const RemoveFromHistoryButton = ({
  type,
  item,
  handleRemoveItemFromHistory,
  handleRemoveKeywordFromHistory
}: {
  type: 'keyword' | 'item';
  item: Item | SearchKeyword;
  handleRemoveItemFromHistory: (item: Item) => void;
  handleRemoveKeywordFromHistory: (item: SearchKeyword) => void;
}) => {
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
