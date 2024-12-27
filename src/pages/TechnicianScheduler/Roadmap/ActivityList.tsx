import { Image, Map } from '@mui/icons-material';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { useCallback } from 'react';

export default function ActivityList(props) {
  const { activity, expanded, selected, handleToggle, handleSelect } = props;

  const getTreeNodes = useCallback(
    (treeList) => {
      return treeList.map((data, index) => {
        let children = [];
        if (data.child && data.child.length > 0) {
          children = getTreeNodes(data.child);
          children.push(<div></div>);
        }

        let label = (
          <Box
            width={'100%'}
            height={91}
            className="d-flex align-items-center"
            onClick={(event) => {
              handleSelect(event, data, 'technician');
            }}
          >
            <Box width={'80%'} className="d-flex align-items-center">
              <Avatar sizes="small" style={{ height: 45, width: 45 }} alt="Remy Sharp" src={data?.photo}>
                <Image style={{ fontSize: 28 }} />
              </Avatar>
              <Box ml={2} sx={{ display: 'flex' }} style={{ flexDirection: 'column' }}>
                <Typography style={{ fontWeight: 'bolder', fontSize: '1rem' }}>{`${data?.firstName} ${data?.lastName}`}</Typography>
                <p className="line-clamp-1 text-[0.8rem] text-gray-500" title={`${data?.competencyType?.optionLabel || ''}`}>
                  {`${data?.competencyType?.optionLabel || ''}`}
                </p>
                <p className="line-clamp-1 text-[0.6rem] text-gray-500" title={`${data?.competencies?.map((e) => e?.optionLabel)?.toString() || ''}`}>
                  {`${data?.competencies?.map((e) => e?.optionLabel)?.toString() || ''}`}
                </p>
              </Box>
            </Box>
            <Box width={'20%'} className="d-flex align-items-center">
              <IconButton
                style={{ padding: 0 }}
                onClick={(event) => {
                  event.stopPropagation();
                  handleSelect(event, data, 'map');
                }}
              >
                <Map fontSize="medium" />
              </IconButton>
            </Box>
          </Box>
        );

        return (
          <TreeItem
            key={index}
            itemId={data._id.toString()}
            id={data._id.toString()}
            label={label}
            children={children}
            style={{ borderBottom: '1px solid var(--common-border-color)' }}
            sx={(theme) => ({
              '&:hover > $content': {
                backgroundColor: theme.palette.action.hover
              },
              '&:focus > $content, &$selected > $content': {
                backgroundColor: `var(--tree-view-bg-color, ${theme.palette.grey[400]})`,
                color: 'var(--tree-view-color)'
              },
              '&:focus > $content $label, &:hover > $content $label, &$selected > $content $label': {
                backgroundColor: 'transparent'
              }
            })}
          />
        );
      });
    },
    [handleSelect]
  );

  let TreeNodes = getTreeNodes(activity);
  return (
    <>
      <SimpleTreeView
        multiSelect={false}
        expandedItems={expanded}
        onExpandedItemsChange={handleToggle}
        selectedItems={selected}
        // onNodeSelect={handleSelect}
      >
        {TreeNodes.map((node) => {
          return node;
        })}
      </SimpleTreeView>
    </>
  );
}
