import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import { withStyles } from '@mui/styles';
import { Theme } from '@mui/material';

const Accordion = withStyles({
  root: {
    border: '0px',
    boxShadow: 'none',

    '&:not(:last-child)': {
      borderBottom: 0
    },
    '&:before': {
      display: 'none'
    },
    '&$expanded': {
      boxShadow: 'none',
      margin: 0
    }
  },
  expanded: {}
})(MuiAccordion);

const AccordionSummary = withStyles((theme: Theme) => ({
  root: {
    padding: '0 8px',
    borderRadius: '5px',
    minHeight: 32,
    '&$expanded': {
      minHeight: 32,
      margin: 0
    }
  },

  content: {
    margin: '0px !important'
  },
  expanded: {},
  expandIcon: {
    padding: '5px !important',
    margin: '0px -5px 0 0 !important'
  }
}))(MuiAccordionSummary);

const AccordionDetails = withStyles((theme: Theme) => ({
  root: {
    display: 'block',
    padding: 0,
    borderRadius: '0'
  }
}))(MuiAccordionDetails);

export { Accordion, AccordionSummary, AccordionDetails };
