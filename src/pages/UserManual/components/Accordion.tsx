import { styled } from '@mui/styles';
import { ExpandMore } from '@mui/icons-material';
import MuiAccordion, { accordionClasses, AccordionProps } from '@mui/material/Accordion';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary, { accordionSummaryClasses, AccordionSummaryProps } from '@mui/material/AccordionSummary';

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} {...props} />)(({ theme }) => ({
  border: '0px',
  boxShadow: 'none',
  '&:before': {
    display: 'none'
  },
  [`&.${accordionClasses.expanded}`]: {
    boxShadow: 'none',
    margin: 0
  }
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => <MuiAccordionSummary expandIcon={<ExpandMore />} className="border" {...props} />)(
  () => ({
    padding: '0 8px',
    minHeight: 48,
    borderRadius: '3.54532px',
    [`&.${accordionSummaryClasses.expanded}`]: {
      margin: 0
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
  padding: 0,
  borderRadius: '0'
}));

export { Accordion, AccordionDetails, AccordionSummary };
