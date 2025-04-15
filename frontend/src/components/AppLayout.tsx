import { Box, CssBaseline, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import DescriptionIcon from '@mui/icons-material/Description';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const menuItems = [
    { label: 'Schema Analyzer', icon: <StorageIcon />, path: '/schema-analyzer' },
    { label: 'Document Creator', icon: <DescriptionIcon />, path: '/document-creator' },
];

export default function AppLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f4f6f8' }}>
            <CssBaseline />
            {/* Header */}
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: '#1976d2' }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
                        Data Engineering Studio
                    </Typography>
                </Toolbar>
            </AppBar>
            {/* Sidebar */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', background: '#233044', color: '#fff' },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto', height: '100%' }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem key={item.label} disablePadding>
                                <ListItemButton
                                    selected={location.pathname === item.path}
                                    onClick={() => navigate(item.path)}
                                    sx={{
                                        color: location.pathname === item.path ? '#1976d2' : '#fff',
                                        background: location.pathname === item.path ? '#e3f2fd' : 'inherit',
                                        '&:hover': { background: '#1565c0', color: '#fff' },
                                    }}
                                >
                                    <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.label} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    <Divider sx={{ bgcolor: '#1976d2', my: 2 }} />
                    <Box sx={{ px: 2, color: '#90caf9', fontSize: 13 }}>
                        <div>Version 1.0</div>
                        <div>© {new Date().getFullYear()} Your Company</div>
                    </Box>
                </Box>
            </Drawer>
            {/* Main Content */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, minHeight: '100vh' }}>
                <Outlet />
                {/* Footer */}
                <Box sx={{ mt: 6, textAlign: 'center', color: '#888', fontSize: 14 }}>
                    Data Engineering Studio &mdash; Empowering Data Teams
                </Box>
            </Box>
        </Box>
    );
}
