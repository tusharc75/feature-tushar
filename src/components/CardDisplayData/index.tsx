import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CopyToClipboard from 'src/components/Helpers/CopyToClipboard';

function DisplayData({ label, value, icon, highlightsHead = false, showCopyToText = false }) {
  return (
    <ListItem style={{ alignItems: 'flex-start', paddingInline: '5px' }}>
      <ListItemIcon style={{ minWidth: '24px', marginTop: 11 }}>{icon}</ListItemIcon>
      <ListItemText
        primary={
          highlightsHead ? (
            <span
              style={{
                padding: '1px 6px',
                borderRadius: '4px',
                display: 'inline-block',
                fontWeight: 600
              }}
              className="line-clamp-1 max-w-full bg-[#EFFBF9] text-[#298B88] dark:bg-[rgb(70,70,108)] dark:text-white"
            >
              {showCopyToText ? <CopyToClipboard textToCopy={value ? value : '-'} /> : value ? value : '-'}
            </span>
          ) : value ? (
            <span style={{ fontSize: '15px' }} className="flex  max-w-full">
              {showCopyToText ? (
                <>
                  <span className="line-clamp-1">{value}</span>
                  <CopyToClipboard textToCopy={value} />
                </>
              ) : (
                value
              )}
            </span>
          ) : (
            '-'
          )
        }
        secondary={<span style={{ fontSize: '14px' }}>{label}</span>}
      />
    </ListItem>
  );
}

export default DisplayData;
