import { Box, Typography } from '@material-ui/core';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { TreeItem, TreeView } from '@material-ui/lab';
import { Virtualizer } from '@tanstack/react-virtual';

type ActivityListProps = {
  activity: any[];
  expanded: string[];
  selected: string;
  handleToggle: any;
  handleSelect: any;
  rowVirtualizer: Virtualizer<any, Element>;
};

const types = [
  { _id: '1', name: 'Planned', color: 'bg-[hsl(46,95%,92%)] dark:bg-[#dda900]' },
  { _id: '2', name: 'In-Use', color: 'bg-[hsl(342,100%,97%)] dark:bg-[#cd3865]' },
  { _id: '3', name: 'Available', color: 'bg-[hsl(206,100%,97%)] dark:bg-[#176fb2]' }
];

export default function ActivityList({ activity, expanded, selected, handleToggle, handleSelect, rowVirtualizer }: ActivityListProps) {
  return (
    <>
      <TreeView
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        expanded={expanded}
        selected={selected}
        onNodeToggle={handleToggle}
        style={{
          height: rowVirtualizer.getTotalSize(),
          position: 'relative'
        }}
        // onNodeSelect={handleSelect}
      >
        {rowVirtualizer.getVirtualItems().map((row) => {
          const newActivity = activity[row.index];

          return (
            <div
              key={newActivity._id}
              data-index={row.index}
              data-id={newActivity?._id}
              ref={(node) => rowVirtualizer.measureElement(node)}
              className="absolute left-0 top-0 w-full transition-all duration-300"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translateY(${row.start - rowVirtualizer.options.scrollMargin}px)`
              }}
            >
              <TreeNode data={newActivity} handleSelect={handleSelect} />
            </div>
          );
        })}
      </TreeView>
    </>
  );
}

const TreeNode = ({ data, handleSelect }) => {
  const label = (
    <Box
      className="d-flex align-items-center h-[30px] w-full bg-[var(--dark-secondary,white)]"
      onClick={(event) => {
        handleSelect(event, data);
      }}
    >
      {data?.productName ? (
        <Typography variant="subtitle2" className="text-truncate" title={data?.productName}>
          {data?.productName}
        </Typography>
      ) : (
        <Typography className="text-truncate">{data?.name}</Typography>
      )}
    </Box>
  );

  return (
    <TreeItem
      style={{ width: '100%' }}
      key={data._id}
      nodeId={data._id.toString()}
      label={label}
      children={types.map((t) => (
        <Box
          key={t._id}
          width={'100%'}
          height={30}
          className={`d-flex align-items-center ${t?.color || 'var(--dark-secondary, white)'} `}
          onClick={(event) => {
            handleSelect(event, data);
          }}
        >
          <Typography className="text-truncate">{t?.name}</Typography>
        </Box>
      ))}
    />
  );
};
