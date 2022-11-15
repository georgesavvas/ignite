import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs',
    component: ComponentCreator('/docs', '4dd'),
    routes: [
      {
        path: '/docs/basic_concepts',
        component: ComponentCreator('/docs/basic_concepts', '1e0'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/Developer/python_api',
        component: ComponentCreator('/docs/Developer/python_api', '9d5'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/Developer/rest_api',
        component: ComponentCreator('/docs/Developer/rest_api', '82f'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/getting_started',
        component: ComponentCreator('/docs/getting_started', 'fdc'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/glossary',
        component: ComponentCreator('/docs/glossary', 'be2'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/installation',
        component: ComponentCreator('/docs/installation', '001'),
        exact: true,
        sidebar: "tutorialSidebar"
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', 'bea'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
