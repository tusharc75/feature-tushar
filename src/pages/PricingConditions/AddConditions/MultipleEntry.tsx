import { Grid, Box, Container, Button, ButtonGroup, TextField, IconButton } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

function MultipleEntry({ discount, index, setDiscount, fieldNames, fieldLabels, label }) {
  return (
    <Box mt={3} p={2} border={1} borderColor="var(--common-border-color)">
      {discount && discount[index] && discount[index]['group'].length ? (
        <Container className="p-0">
          <Grid container direction="row" justify="space-evenly" alignItems="center">
            <Grid item md={12}>
              <Box>
                <Grid container spacing={2} direction="row" justify="flex-start" alignItems="center">
                  <Grid item md={1}>
                    #
                  </Grid>
                  <Grid item md={5}>
                    {fieldLabels[0]}
                  </Grid>
                  <Grid item md={4}>
                    {fieldLabels[1]}
                  </Grid>
                  <Grid item md={2}></Grid>
                </Grid>
              </Box>
              <Box className="p-1">
                {discount[index]['group'].map((data, i) => (
                  <Grid container spacing={2} direction="row" justify="flex-start" alignItems="center" key={i}>
                    <Grid item md={1}>
                      {i + 1}
                    </Grid>
                    <Grid item md={5}>
                      <TextField
                        name={'qty_' + i}
                        variant="outlined"
                        margin="dense"
                        size="small"
                        fullWidth
                        type="number"
                        value={data[fieldNames[0]]}
                        onChange={(e) => {
                          const _list = [...discount];
                          discount[index]['group'][i][fieldNames[0]] = parseFloat(e.target.value);
                          setDiscount(_list);
                        }}
                      />
                    </Grid>
                    <Grid item md={4}>
                      <TextField
                        name={'rate_' + index}
                        variant="outlined"
                        margin="dense"
                        size="small"
                        fullWidth
                        type="number"
                        value={data[fieldNames[1]]}
                        onChange={(e) => {
                          const _list = [...discount];
                          discount[index]['group'][i][fieldNames[1]] = parseFloat(e.target.value);
                          setDiscount(_list);
                        }}
                      />
                    </Grid>
                    <Grid item md={2}>
                      <ButtonGroup size="small" aria-label="small outlined button group">
                        <IconButton
                          size="small"
                          aria-label="add"
                          onClick={() => {
                            const _list = [...discount];
                            _list[index]['group'].push({ [fieldNames[0]]: 0, [fieldNames[1]]: 0 });
                            setDiscount(_list);
                          }}
                        >
                          <Add />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label="delete"
                          onClick={() => {
                            const _list = [...discount];
                            _list[index]['group'].splice(i, 1);
                            setDiscount(_list);
                          }}
                        >
                          <Delete color="error" />
                        </IconButton>
                      </ButtonGroup>
                    </Grid>
                  </Grid>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      ) : (
        <Grid item md={12}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
              const _list = [...discount];
              _list[index]['group'].push({ [fieldNames[0]]: 0, [fieldNames[1]]: 0 });
              setDiscount(_list);
            }}
          >
            Add {label}
          </Button>
        </Grid>
      )}
    </Box>
  );
}

export default MultipleEntry;
