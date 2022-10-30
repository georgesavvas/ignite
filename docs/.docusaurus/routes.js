import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '881'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '010'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', '810'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'e98'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', 'e1c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '33a'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', 'd34'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', 'a73'),
    routes: [
      {
        path: '/docs/getting_started/',
        component: ComponentCreator('/docs/getting_started/', '36b'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/getting_started/creating_project',
        component: ComponentCreator('/docs/getting_started/creating_project', '49a'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/getting_started/launching_software',
        component: ComponentCreator('/docs/getting_started/launching_software', '815'),
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
    component: ComponentCreator('/', '71c'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
