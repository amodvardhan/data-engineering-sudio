import { JSX } from 'react';
import { RouteObject } from 'react-router-dom';
import SchemaAnalyzer from '../features/schema-analyzer/SchemaAnalyzer';

const routes: (RouteObject & {
    label: string;
    icon: JSX.Element;
})[] = [
        {
            path: '/schema-analyzer',
            element: <SchemaAnalyzer />,
            label: 'Schema Analyzer',
            icon: <DatabaseIcon />,
        },
        // Add future routes here
    ];

export default routes;
