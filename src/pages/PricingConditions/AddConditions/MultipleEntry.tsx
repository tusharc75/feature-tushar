import { Box, Container, ButtonGroup, TextField, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Add, Delete } from '@mui/icons-material';
import { ThemeButton } from 'src/components/Helpers/Buttons';

function MultipleEntry({ discount, index, setDiscount, fieldNames, fieldLabels, label }) {
  return (
    <Box mt={3} p={2} border={1} borderColor="var(--common-border-color)">
      {discount && discount[index] && discount[index]['group'].length ? (
        <Container className="p-0">
          <Grid container direction="row" justifyContent="space-evenly" alignItems="center">
            <Grid size={{ md: 12 }}>
              <Box>
                <Grid container spacing={2} direction="row" justifyContent="flex-start" alignItems="center">
                  <Grid size={{ md: 1 }}>
                    #
                  </Grid>
                  <Grid size={{ md: 5 }}>
                    {fieldLabels[0]}
                  </Grid>
                  <Grid size={{ md: 4 }}>
                    {fieldLabels[1]}
                  </Grid>
                  <Grid size={{ md: 2 }}></Grid>
                </Grid>
              </Box>
              <Box className="p-1">
                {discount[index]['group'].map((data, i) => (
                  <Grid container spacing={2} direction="row" justifyContent="flex-start" alignItems="center" key={i}>
                    <Grid size={{ md: 1 }}>
                      {i + 1}
                    </Grid>
                    <Grid size={{ md: 5 }}>
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
                    <Grid size={{ md: 4 }}>
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
                    <Grid size={{ md: 2 }}>
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
        <Grid size={{ md: 12 }}>
          <ThemeButton
            onClick={() => {
              const _list = [...discount];
              _list[index]['group'].push({ [fieldNames[0]]: 0, [fieldNames[1]]: 0 });
              setDiscount(_list);
            }}
          >
            Add {label}
          </ThemeButton>
        </Grid>
      )}
    </Box>
  );
}

export default MultipleEntry;
