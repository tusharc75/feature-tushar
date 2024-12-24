import { makeStyles } from '@mui/styles';
import { Box, Container, Typography, Button } from '@mui/material';
import { useHistory } from 'react-router-dom';

import Footer from '../components/Footer';

const useStyles = makeStyles((theme) => ({
  heading: {
    color: theme.palette.primary.main,
    fontWeight: 'bold',
    fontSize: '150px'
  },
  subtext: {
    color: theme.palette.primary.main,
    fontWeight: 'bold',
    fontSize: '50px'
  }
}));

const NotFound = () => {
  const history = useHistory();
  const classes = useStyles();
  return (
    <Container maxWidth="md">
      <Box marginY={5} textAlign="center" height="85vh" display="flex" flexDirection="column">
        <Box>
          <Typography className={classes.heading} component="h1" variant="h1">
            404
          </Typography>
          <Typography className={classes.subtext} variant="h4">
            Oops! Page not found!
          </Typography>
        </Box>

        <Box marginTop={5}>
          <Button color="primary" onClick={() => history.push('/')}>
            Go Back
          </Button>
          <Box component="span" marginX={2} />
          <Button color="primary" onClick={() => history.goBack()}>
            Home
          </Button>
        </Box>
      </Box>

      <Footer />
    </Container>
  );
};

export default NotFound;
