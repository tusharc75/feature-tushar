import { ExpandMore } from '@mui/icons-material';
import MuiAccordion, { accordionClasses, AccordionProps } from '@mui/material/Accordion';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary, { accordionSummaryClasses, AccordionSummaryProps } from '@mui/material/AccordionSummary';
import { styled } from '@mui/styles';
import { cn } from 'src/constants/helpers';

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} {...props} />)(({ theme }) => ({
  borderRadius: '6px !important',
  boxShadow: 'unset !important',
  border: '1px solid var(--common-border-color) !important',
  '&:before': {
    display: 'none'
  },
  [`&.${accordionClasses.expanded}`]: {
    margin: 'auto',
    boxShadow: '0px 17.7266px 35.4532px rgba(0, 0, 0, 0.03) !important'
  }
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => <MuiAccordionSummary expandIcon={<ExpandMore />} className="border" {...props} />)(
  () => ({
    backgroundColor: 'var(--accordion-summary-bg, #fff)',
    padding: '0 8px',
    minHeight: 48,
    borderRadius: '3.54532px',
    flexDirection: 'row-reverse',
    [`&.${accordionSummaryClasses.expanded}`]: {
      minHeight: 48,
      backgroundColor: 'var(--accordion-expanded-summary-bg, #f1f5ff)',
      borderRadius: '3.54532px 3.54532px 0px 0px'
    },
    [`& .${accordionSummaryClasses.content}`]: {
      flexGrow: 1,
      '& > *': {
        flexGrow: 1
      },
      [`&.${accordionSummaryClasses.expanded}`]: {
        margin: '12px 0'
      }
    }
  })
);

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  display: 'block',
  padding: '16px',
  borderTop: '1px solid var(--accordion-details-border)',
  borderRadius: '0px 0px 6px 6px'
}));

export { Accordion, AccordionDetails, AccordionSummary };
