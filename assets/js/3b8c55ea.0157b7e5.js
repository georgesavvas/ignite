"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[217],{3905:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>g});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var l=r.createContext({}),c=function(e){var t=r.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},u=function(e){var t=c(e.components);return r.createElement(l.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,i=e.originalType,l=e.parentName,u=s(e,["components","mdxType","originalType","parentName"]),d=c(n),g=o,f=d["".concat(l,".").concat(g)]||d[g]||p[g]||i;return n?r.createElement(f,a(a({ref:t},u),{},{components:n})):r.createElement(f,a({ref:t},u))}));function g(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var i=n.length,a=new Array(i);a[0]=d;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s.mdxType="string"==typeof e?e:o,a[1]=s;for(var c=2;c<i;c++)a[c]=n[c];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},9803:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>l,contentTitle:()=>a,default:()=>p,frontMatter:()=>i,metadata:()=>s,toc:()=>c});var r=n(7462),o=(n(7294),n(3905));const i={sidebar_position:0},a="Installation",s={unversionedId:"installation",id:"installation",title:"Installation",description:"Setting up ignite on a single workstation",source:"@site/docs/installation.md",sourceDirName:".",slug:"/installation",permalink:"/docs/installation",draft:!1,tags:[],version:"current",sidebarPosition:0,frontMatter:{sidebar_position:0},sidebar:"tutorialSidebar",next:{title:"Getting Started",permalink:"/docs/getting_started"}},l={},c=[{value:"Setting up ignite on a single workstation",id:"setting-up-ignite-on-a-single-workstation",level:2},{value:"Software discovery",id:"software-discovery",level:2},{value:"Advanced setup",id:"advanced-setup",level:2}],u={toc:c};function p(e){let{components:t,...n}=e;return(0,o.kt)("wrapper",(0,r.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"installation"},"Installation"),(0,o.kt)("h2",{id:"setting-up-ignite-on-a-single-workstation"},"Setting up ignite on a single workstation"),(0,o.kt)("p",null,"Once Ignite is installed and launched, it will prompt you for a projects directory. This is where your Ignite-managed projects will live in. Even though an ignite project is simply a directory tree, each directory contains useful metadata that tells Ignite how to traverse the project and how to treat each level. As such it is advised you choose an empty directory and either create projects from scratch or recreate existing ones by copying over your scenes and assets. A tool to assist with the migration of existing non Ignite projects is in concept stage."),(0,o.kt)("h2",{id:"software-discovery"},"Software discovery"),(0,o.kt)("p",null,"Ignite will initially attempt to find any supported applications that can be used to create and edit scenes. If any of your apps are installed in custom directories you will have to manually tell Ignite where to find it by using the DCC tab in the Settings dialogue. This is especially true for Linux systems where installation directories are less standardised."),(0,o.kt)("h2",{id:"advanced-setup"},"Advanced setup"),(0,o.kt)("p",null,"The Ignite Server can function separately to the UI. This is useful when you want the server to run on a different box (for example a raspberry pi) and serve content to actual workstations. In that case the UI can be set up to connect to the existing server as opposed to firing up its own."),(0,o.kt)("p",null,"Start by installing Ignite on both your server box and your workstation.\nOn the server box launch the IgniteServer application.\nOn the workstation, launch Ignite and open up the Settings dialogue from the top right gear icon. Fill in the server address field using the local IP address of your server box and you are good to go :)"))}p.isMDXComponent=!0}}]);