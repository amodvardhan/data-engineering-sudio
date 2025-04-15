import { Snackbar, Alert } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../app/hooks'; // Correct import
import { clearStatus } from '../features/schema-analyzer/store/schemaAnalyzerSlice';

export default function StatusSnackbar() {
    const status = useAppSelector((state) => state.schemaAnalyzer.status);
    const statusSeverity = useAppSelector((state) => state.schemaAnalyzer.statusSeverity);
    const dispatch = useAppDispatch();

    return (
        <Snackbar
            open={!!status}
            autoHideDuration={6000}
            onClose={() => dispatch(clearStatus())}
        >
            <Alert severity={statusSeverity || 'info'} sx={{ width: '100%' }}>
                {status}
            </Alert>
        </Snackbar>
    );
}
