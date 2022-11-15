import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
<<<<<<< HEAD
=======
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '862'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', 'b8c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'cdf'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'b62'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', 'f8f'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '3ca'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '4ee'),
    exact: true
  },
  {
>>>>>>> main
    path: '/docs',
    component: ComponentCreator('/docs', '4dd'),
    routes: [
      {
        path: '/docs/basic_concepts',
        component: ComponentCreator('/docs/basic_concepts', '1e0'),
<<<<<<< HEAD
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
=======
>>>>>>> main
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
<<<<<<< HEAD
        path: '/docs/getting_started',
        component: ComponentCreator('/docs/getting_started', 'fdc'),
=======
        path: '/docs/Developer/python_api',
        component: ComponentCreator('/docs/Developer/python_api', '9d5'),
>>>>>>> main
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
<<<<<<< HEAD
=======
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
>>>>>>> main
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
