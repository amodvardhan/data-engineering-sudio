import { TextField, Button, CircularProgress, Alert, CardContent, Typography, MenuItem } from '@mui/material';

export default function ConnectionForm({ config, setConfig, loading, error, onConnect }: any) {
    return (
        <CardContent>
            <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>
                Database Connection
            </Typography>
            <form onSubmit={(e) => { e.preventDefault(); onConnect(); }}>
                <TextField
                    select
                    label="Database Type"
                    value={config.databaseType}
                    onChange={(e) => setConfig({ ...config, databaseType: e.target.value })}
                    fullWidth
                    sx={{ mb: 2 }}
                >
                    {['postgres', 'mysql', 'sqlserver'].map((dbType) => (
                        <MenuItem key={dbType} value={dbType}>{dbType}</MenuItem>
                    ))}
                </TextField>
                <TextField
                    label="Host"
                    value={config.host}
                    onChange={(e) => setConfig({ ...config, host: e.target.value })}
                    fullWidth
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="Username"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    fullWidth
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="Password"
                    type="password"
                    value={config.password}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                    fullWidth
                    sx={{ mb: 2 }}
                />
                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    {loading ? 'Connecting...' : 'Connect'}
                </Button>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </form>
        </CardContent>
    );
}
