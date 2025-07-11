import CloseIcon from '@mui/icons-material/Close';
import {
  Dialog,
  IconButton,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  DialogTitle,
  DialogContent
} from '@mui/material';
import dayjs from 'dayjs';
import { camelCase } from 'lodash';
import { useMemo, useState } from 'react';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { useData } from 'src/StateProvider/Provider';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { cn, CustomDialogTransition, dateFormat, displayDate } from 'src/constants/helpers';

const ResourcePopover = ({ anchorEl, data, eventData, open, onClose, resourceList }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const {
    state: { resources }
  }: any = useData();

  const content = useMemo(() => {
    return (
      <div className="space-y-3">
        {data?.map((d) => (
          <Accordion key={d.key} defaultExpanded>
            <AccordionSummary>
              <h6 className=" text-sm font-semibold">{d.heading}</h6>
            </AccordionSummary>
            <AccordionDetails>
              <RenderTable data={d.items} resources={resources} resourceList={resourceList} />
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    );
  }, [data, resourceList, resources]);

  const head = useMemo(() => {
    return (
      <div className="sticky top-0 z-10 flex items-center justify-between bg-[var(--dark-primary,white)] pb-1 pr-1 pt-1">
        <h5 className="text-sm">{`${eventData?.title} - ${displayDate(eventData?.originalDate || eventData?.start)}`}</h5>
        <div className="flex gap-1">
          <HtmlTooltip title={!isFullScreen ? 'Maximize' : 'Minimize'}>
            <IconButton size="small" onClick={() => setIsFullScreen((prev) => !prev)} className="close-icon-v1">
              {!isFullScreen ? <FiMaximize2 /> : <FiMinimize2 />}
            </IconButton>
          </HtmlTooltip>
          <HtmlTooltip title="Close">
            <IconButton size="small" onClick={() => onClose()} className="close-icon-v1">
              <CloseIcon fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        </div>
      </div>
    );
  }, [eventData?.title, isFullScreen, onClose, eventData?.originalDate, eventData?.start]);

  return (
    <>
      <Popover open={true} anchorEl={anchorEl} onClose={onClose} style={{ minWidth: '300px' }}>
        <div className="p-2">{head}</div>
        <div className={cn('max-h-[600px] overflow-y-auto overflow-x-hidden p-2 ')}>{content}</div>
      </Popover>
      <Dialog
        open={isFullScreen}
        fullScreen
        fullWidth
        slotProps={{
          transition: CustomDialogTransition
        }}
      >
        <DialogTitle>{head}</DialogTitle>
        <DialogContent>{content}</DialogContent>
      </Dialog>
    </>
  );
};

export default ResourcePopover;

const RenderTable = ({ data, resources, resourceList }) => {
  return (
    <TableContainer>
      <Table className="min-w-[530px]" aria-label="simple table" size="small">
        <TableHead>
          <TableRow>
            <TableCell>Reference</TableCell>
            <TableCell>Qty</TableCell>
            <TableCell>{resources?.warehouse?.titleSingular}</TableCell>
            <TableCell>{resources?.customerAccount?.titleSingular}</TableCell>
            {data?.find((e) => e?.padName) && <TableCell>Pad Name</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.referenceId}>
              <TableCell component="th" scope="row">
                <p
                  onClick={() => {
                    const resource = resourceList?.find((r) => r.resource === row?.resource);
                    if (resource) {
                      window.open(`${resource.path}/${row?.referenceId}`);
                    }
                  }}
                  className="link text-truncate"
                  title={row?.resourceLabel}
                >
                  {row.resourceLabel}
                </p>
              </TableCell>
              <TableCell component="th" scope="row">
                {row.qty}
              </TableCell>
              <TableCell component="th" scope="row">
                {row?.warehouse?.optionLabel}
              </TableCell>
              <TableCell component="th" scope="row">
                {row?.customerAccount?.optionLabel ? row?.customerAccount?.optionLabel : <NoDataCell />}
              </TableCell>
              {data?.find((e) => e?.padName) && (
                <TableCell component="th" scope="row">
                  {row?.padName?.optionLabel ? row?.padName?.optionLabel : <NoDataCell />}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
