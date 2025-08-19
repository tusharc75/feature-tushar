import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';

type Op = 'gte' | 'lte' | 'gt' | 'lt' | 'eq';

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
    { value: 'eq', label: 'Equals' }
];

const NumberFilter: React.FC<Props> = ({ fieldData, deepFilters, setDeepFilters, sidebarIcon = null, selectedUserFilter = null }) => {
    const fieldName = fieldData?.fieldName;

    const [opA, setOpA] = useState<Op>('gte');
    const [valA, setValA] = useState<string>('');
    const [opB, setOpB] = useState<Op>('lte');
    const [valB, setValB] = useState<string>('');

    const isPresent = useMemo(() => {
        return Boolean(deepFilters?.find((d) => d?.field === fieldName && (d?.type === 'number' || d?.type === 'decimal')));
    }, [deepFilters, fieldName]);

    useEffect(() => {
        const d = deepFilters?.find((dd) => dd?.field === fieldName && (dd?.type === 'number' || dd?.type === 'decimal'));
        if (d && Array.isArray(d.term)) {
            const first = d.term[0];
            const second = d.term[1];

            if (first) {
                setOpA(first.operation || 'gte');
                setValA(first.value !== undefined && first.value !== null ? String(first.value) : '');
            } else {
                setOpA('gte');
                setValA('');
            }

            if (second) {
                setOpB(second.operation || 'lte');
                setValB(second.value !== undefined && second.value !== null ? String(second.value) : '');
            } else {
                setOpB('lte');
                setValB('');
            }
        } else {
            setOpA('gte');
            setValA('');
            setOpB('lte');
            setValB('');
        }
    }, [selectedUserFilter]);

    const buildTerms = useCallback(() => {
        const terms: { operation: Op; value: number }[] = [];
        const nA = valA !== '' && !isNaN(Number(valA)) ? Number(valA) : undefined;
        const nB = valB !== '' && !isNaN(Number(valB)) ? Number(valB) : undefined;

        if (nA !== undefined) {
            terms.push({ operation: opA, value: nA });
        }
        if (nB !== undefined) {
            terms.push({ operation: opB, value: nB });
        }

        return terms.length ? terms : null;
    }, [opA, valA, opB, valB]);

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
    }, [valA, opA, valB, opB, fieldName, buildTerms, setDeepFilters]);

    const handleClear = useCallback(() => {
        setOpA('gte');
        setValA('');
        setOpB('lte');
        setValB('');
        setDeepFilters((prev) => (prev || []).filter((d) => d?.field !== fieldName));
    }, [fieldName, setDeepFilters]);

    return (
        <>
            <div className="sticky top-0 z-10 flex min-h-[64px] items-center justify-between bg-[var(--dark-primary,white)] py-[--py,_16px]">
                <div className="flex items-center gap-2">
                    {sidebarIcon}
                    <p className="text-[16px] font-medium leading-[19px]">{fieldData?.fieldLabel}</p>
                </div>
            </div>

            <div className="mt-5 w-1/2">
                <div className="flex gap-2">
                    <FormControl fullWidth size="small" variant="outlined">
                        <InputLabel id={`opA-${fieldName}`}>Operator</InputLabel>
                        <Select
                            size="small"
                            labelId={`opA-${fieldName}`}
                            id={`opA-${fieldName}-select`}
                            value={opA}
                            label="Operator"
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
                </div>

                <div className="flex gap-2 mt-3">
                    <FormControl fullWidth size="small" variant="outlined">
                        <InputLabel id={`opB-${fieldName}`}>Operator</InputLabel>
                        <Select
                            size="small"
                            labelId={`opB-${fieldName}`}
                            id={`opB-${fieldName}-select`}
                            value={opB}
                            label="Operator"
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
                </div>

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

