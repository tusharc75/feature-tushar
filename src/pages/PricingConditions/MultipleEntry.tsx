
import { Grid, Box, Container, Button, ButtonGroup, TextField, IconButton } from "@material-ui/core";
import { Add, Delete } from "@material-ui/icons";


export default function MultipleEntry({ list, setList, fieldNames, fieldLabels, label }) {
    return <Box mt={3} p={2} border={1} borderColor="grey.300">
        {list && list.length ?
            <Container className="p-0" >
                <Grid
                    container
                    direction="row"
                    justify="space-evenly"
                    alignItems="center"
                >
                    <Grid item md={12}>
                        <Box>
                            <Grid
                                container
                                spacing={2}
                                direction="row"
                                justify="flex-start"
                                alignItems="center"
                            >
                                <Grid item md={1}>#</Grid>
                                <Grid item md={5}>{fieldLabels[0]}</Grid>
                                <Grid item md={4}>{fieldLabels[1]}</Grid>
                                <Grid item md={2}></Grid>
                            </Grid>
                        </Box>
                        <Box className="p-1" >
                            {list.map((data, index) => (
                                <Grid
                                    container
                                    spacing={2}
                                    direction="row"
                                    justify="flex-start"
                                    alignItems="center"
                                    key={index}
                                >
                                    <Grid item md={1}>{index + 1}</Grid>
                                    <Grid item md={5}>
                                        <TextField
                                            name={"qty_" + index}
                                            variant="outlined"
                                            margin="dense"
                                            fullWidth
                                            type="number"
                                            value={data[fieldNames[0]]}
                                            onChange={(e) => {
                                                const _list = [...list];
                                                _list[index][fieldNames[0]] = e.target.value;
                                                setList(_list)
                                            }}
                                        />
                                    </Grid>
                                    <Grid item md={4}>
                                        <TextField
                                            name={"rate_" + index}
                                            variant="outlined"
                                            margin="dense"
                                            fullWidth
                                            type="number"
                                            value={data[fieldNames[1]]}
                                            onChange={(e) => {
                                                const _list = [...list];
                                                _list[index][fieldNames[1]] = e.target.value;
                                                setList(_list)
                                            }}
                                        />
                                    </Grid>
                                    <Grid item md={2}>
                                        <ButtonGroup size="small" aria-label="small outlined button group">
                                            <IconButton
                                                size="small"
                                                aria-label="add"
                                                onClick={() => { setList([...list, { [fieldNames[0]]: 0, [fieldNames[1]]: 0 }]) }} >
                                                <Add />
                                            </IconButton>
                                            <IconButton size="small" aria-label="delete"
                                                onClick={() => {
                                                    const _list = [...list];
                                                    _list.splice(index, 1)
                                                    setList(_list)
                                                }} >
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
            :
            <Grid item md={12} className="d-flex align-items-center justify-content-center">
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => { setList([...list, { [fieldNames[0]]: 0, [fieldNames[1]]: 0 }]) }}
                >
                    Add {label}
                </Button>
            </Grid>
        }

    </Box>
}