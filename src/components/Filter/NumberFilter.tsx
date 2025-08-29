import React, { useCallback, useEffect, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select, TextField, IconButton } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

type Op = 'gte' | 'lte' | 'gt' | 'lt' | 'eq' | 'ne';

type Props = {
    fieldData: any;
    deepFilters: any[];
    setDeepFilters: (f: any) => void;
    required?: boolean;
    sidebarIcon?: React.ReactNode | null;
    selectedUserFilter?: any | null;
};

const operators: { value: Op; label: string }[] = [
    { value: 'gte', label: 'Greater than or equal' },
    { value: 'gt', label: 'Greater than' },
    { value: 'lte', label: 'Less than or equal' },
    { value: 'lt', label: 'Less than' },
    { value: 'eq', label: 'Equals' },
    { value: 'ne', label: 'Not equal' }
];

const NumberFilter: React.FC<Props> = ({ fieldData, deepFilters, setDeepFilters, sidebarIcon = null, selectedUserFilter = null }) => {
    const fieldName = fieldData?.fieldName;

    const [opA, setOpA] = useState<Op | ''>('');
    const [valA, setValA] = useState<string>('');
    const [opB, setOpB] = useState<Op | ''>('');
    const [valB, setValB] = useState<string>('');
    const [showSecondRow, setShowSecondRow] = useState(false);

    useEffect(() => {
        const d = deepFilters?.find((dd) => dd?.field === fieldName && (dd?.type === 'number' || dd?.type === 'decimal'));
        if (d && Array.isArray(d.term)) {
            const first = d.term[0];
            const second = d.term[1];

            if (first) {
                setOpA(first.operation || '');
                setValA(first.value !== undefined && first.value !== null ? String(first.value) : '');
            }

            if (second) {
                setOpB(second.operation || '');
                setValB(second.value !== undefined && second.value !== null ? String(second.value) : '');
                setShowSecondRow(true);
            } else {
                setShowSecondRow(false);
            }
        } else {
            setOpA('');
            setValA('');
            setOpB('');
            setValB('');
            setShowSecondRow(false);
        }
    }, [selectedUserFilter]);

    const buildTerms = useCallback(() => {
        const terms: any = [];
        const nA = valA !== '' && !isNaN(Number(valA)) ? Number(valA) : undefined;
        const nB = valB !== '' && !isNaN(Number(valB)) ? Number(valB) : undefined;
        if (nA !== undefined) {
            terms.push({ operation: opA, value: nA });
        }
        if (nB !== undefined) {
            terms.push({ operation: opB, value: nB });
        }
        return terms.length ? terms : null;
    }, [opA, valA, opB, valB, showSecondRow]);

    useEffect(() => {
        const terms = buildTerms();
        if (!terms) {
            setDeepFilters((prev) => (prev || []).filter((d) => d?.field !== fieldName));
            return;
        }

        const payload = {
            field: fieldName,
            type: 'number',
            term: terms
        };

        setDeepFilters((prev) => {
            const rest = (prev || []).filter((d) => d?.field !== fieldName);
            return [...rest, payload];
        });
    }, [valA, opA, valB, opB, showSecondRow, fieldName, buildTerms, setDeepFilters]);

    const handleClear = useCallback(() => {
        setOpA('');
        setValA('');
        setOpB('');
        setValB('');
        setShowSecondRow(false);
        setDeepFilters((prev) => (prev || []).filter((d) => d?.field !== fieldName));
    }, [fieldName, setDeepFilters]);

    return (
        <>
            <div className="sticky top-0 z-10 flex min-h-[64px] items-center justify-between bg-[var(--dark-primary,white)] py-[--py,_16px] px-2">
                <div className="flex items-center gap-2">
                    {sidebarIcon}
                    <p className="text-[16px] font-medium leading-[19px]">{fieldData?.fieldLabel}</p>
                </div>
            </div>
            <div className="mt-5 w-full">
                <div className="flex gap-2 items-center">
                    <FormControl fullWidth size="small" variant="outlined" >
                        <InputLabel id={`opA-${fieldName}`}>Filter</InputLabel>
                        <Select
                            fullWidth
                            size="small"
                            labelId={`opA-${fieldName}`}
                            id={`opA-${fieldName}-select`}
                            value={opA}
                            label="Filter"
                            onChange={(e) => setOpA(e.target.value as Op)}
                        >
                            {operators.map((o) => (
                                <MenuItem key={o.value} value={o.value}>
                                    {o.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        size="small"
                        type="number"
                        inputProps={{ step: 'any', inputMode: 'decimal' }}
                        label="Value"
                        value={valA}
                        onChange={(e) => setValA(e.target.value)}
                    />
                    <HtmlTooltip title="Add another condition (max 2)">
                        <span>
                            <IconButton
                                onClick={() => setShowSecondRow(true)}
                                aria-label="Add condition"
                                disabled={showSecondRow}
                                size='small'
                            >
                                <AddIcon fontSize='small' color='primary' />
                            </IconButton>
                        </span>
                    </HtmlTooltip>
                </div>
                {showSecondRow && (
                    <div className="flex gap-2 mt-3 items-center">
                        <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel id={`opB-${fieldName}`}>Filter</InputLabel>
                            <Select
                                size="small"
                                labelId={`opB-${fieldName}`}
                                id={`opB-${fieldName}-select`}
                                value={opB}
                                label="Filter"
                                onChange={(e) => setOpB(e.target.value as Op)}
                            >
                                {operators.map((o) => (
                                    <MenuItem key={o.value} value={o.value}>
                                        {o.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            inputProps={{ step: 'any', inputMode: 'decimal' }}
                            label="Value"
                            value={valB}
                            onChange={(e) => setValB(e.target.value)}
                        />
                        <HtmlTooltip title="Remove">
                            <span>
                                <IconButton
                                    onClick={() => setShowSecondRow(false)}
                                    aria-label="Remove condition"
                                    size='small'
                                    disabled={!showSecondRow}
                                >
                                    <RemoveIcon fontSize='small' color='error' />
                                </IconButton>
                            </span>
                        </HtmlTooltip>
                    </div>
                )}
                <div className="mt-4 flex gap-2">
                    <ThemeButton onClick={handleClear} iconForMobile={false}>
                        Clear
                    </ThemeButton>
                </div>
            </div>
        </>
    );
};

export default NumberFilter;