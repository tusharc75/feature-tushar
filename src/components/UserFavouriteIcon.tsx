import { IconButton } from '@material-ui/core';
import { Star, StarOutline } from '@material-ui/icons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useFavorites } from 'src/hooks';
import { Item } from 'src/pages/Home/types';

const UserFavoriteIcon = ({ item }: { item: Item }) => {
  const { favorites, handleSetFavourite } = useFavorites();

  return (
    <HtmlTooltip title={favorites?.[item.resourceId] ? 'Remove from your Favorite' : 'Add to your Favorite'}>
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          handleSetFavourite(item);
        }}
        size="small"
      >
        {favorites?.[item.resourceId] ? (
          <Star className="mr-0 text-[var(--new-theme-color)]" />
        ) : (
          <StarOutline className="mr-0 text-[var(--new-theme-color)]" />
        )}
      </IconButton>
    </HtmlTooltip>
  );
};

export default UserFavoriteIcon;
