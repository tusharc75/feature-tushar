import { IconButton } from '@mui/material';
import { Star, StarOutline } from '@mui/icons-material';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useFavorites } from 'src/hooks';
import { Item } from 'src/pages/Home/types';

const UserFavoriteIcon = ({ item }: { item: Item }) => {
  const { favorites, handleSetFavourite } = useFavorites();

  return (
    <HtmlTooltip title={favorites?.[item.name] ? 'Remove from your Favorite' : 'Add to your Favorite'}>
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          handleSetFavourite(item);
        }}
        size="small"
      >
        {favorites?.[item.name] ? (
          <Star className="mr-0 text-[var(--new-theme-color)]" />
        ) : (
          <StarOutline className="mr-0 text-[var(--new-theme-color)]" />
        )}
      </IconButton>
    </HtmlTooltip>
  );
};

export default UserFavoriteIcon;
