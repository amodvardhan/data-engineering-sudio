import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { routes } from '../../app/routes';

const Navigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <nav>
            <List>
                {routes.map((route) => (
                    <ListItem key={route.path} disablePadding>
                        <ListItemButton
                            selected={location.pathname === route.path}
                            onClick={() => navigate(route.path)}
                        >
                            <ListItemIcon>{route.icon}</ListItemIcon>
                            <ListItemText primary={route.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </nav>
    );
};
