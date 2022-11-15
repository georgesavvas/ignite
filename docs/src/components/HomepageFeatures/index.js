import React from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: "Installation",
    // Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    url: "/docs/installation",
    description: (
      <>
        Guide on installing Ignite either on a single machine or multiple ones
        (separate server and client boxes).
      </>
    ),
  },
  {
    title: "Getting Started",
    url: "/docs/getting_started",
    description: (
      <>
        A checklist of things to do once Ignite has been installed.
      </>
    ),
  },
  {
    title: "Developer",
    url: "/docs/developer",
    description: (
      <>
        Useful information as well as reference for Ignite's APIs.
      </>
    ),
  },
  {
    title: "Glossary",
    url: "/docs/glossary",
    description: (
      <>
        Explanation of Ignite terms.
      </>
    ),
  },
];

function Feature({Svg, title, description, url}) {
  return (
    <Link to={url} style={{color: "whitesmoke", textDecoration: "none"}}>
      {/* <div className={clsx('col col--4')}> */}
        {/* <div className="text--center">
          <Svg className={styles.featureSvg} role="img" />
        </div> */}
        <div className={styles.button}>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      {/* </div> */}
    </Link>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className={styles.container}>
        {FeatureList.map((props, idx) => (
          <Feature key={idx} {...props} />
        ))}
      </div>
    </section>
  );
}
