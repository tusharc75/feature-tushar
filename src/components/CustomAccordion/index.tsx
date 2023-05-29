import { withStyles } from '@material-ui/core/styles';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';

const Accordion = withStyles({
  root: {
    border: '0px',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.06)',

    '&:not(:last-child)': {
      borderBottom: 0
    },
    '&:before': {
      display: 'none'
    },
    '&$expanded': {
      margin: 'auto',
      boxShadow: '0px 17.7266px 35.4532px rgba(0, 0, 0, 0.03)'
    }
  },
  expanded: {}
})(MuiAccordion);

const AccordionSummary = withStyles({
  root: {
    backgroundColor: 'var(--accordion-summary-bg, #fff)',
    padding: '0 8px',
    minHeight: 48,
    borderRadius: '3.54532px',
    '&$expanded': {
      minHeight: 48,
      backgroundColor: 'var(--accordion-expanded-summary-bg, #f1f5ff)',
      borderRadius: '3.54532px 3.54532px 0px 0px'
    }
  },
  content: {
    '&$expanded': {
      margin: '12px 0'
    }
  },
  expanded: {}
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
  root: {
    display: 'block',
    padding: theme.spacing(2),
    border: '1px solid var(--accordion-details-border)',
    borderRadius: '0px 0px 6px 6px'
  }
}))(MuiAccordionDetails);

export { Accordion, AccordionSummary, AccordionDetails };
