if(!self.define){let e,s={};const i=(i,a)=>(i=new URL(i+".js",a).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(a,t)=>{const n=e||("document"in self?document.currentScript.src:"")||location.href;if(s[n])return;let r={};const c=e=>i(e,n),u={module:{uri:n},exports:r,require:c};s[n]=Promise.all(a.map((e=>u[e]||c(e)))).then((e=>(t(...e),r)))}}define(["./workbox-4754cb34"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/app-build-manifest.json",revision:"e0cd0d94df84f27f2472f2ce7452fd43"},{url:"/_next/static/chunks/1084-e1897cfe7a7007e8.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/1295-b0c60c1361246cfc.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/1345-d17e343ab3d03d40.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/1517-839e6d36f2bf6478.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/1677-b641a72719821dc7.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/1728-c9e536f59aa84c12.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/1742.964d1774034f91e8.js",revision:"964d1774034f91e8"},{url:"/_next/static/chunks/1868.34d45a721a0f2575.js",revision:"34d45a721a0f2575"},{url:"/_next/static/chunks/1909.0eb8abc54abad4ce.js",revision:"0eb8abc54abad4ce"},{url:"/_next/static/chunks/248-7a9fd0a2d8444fb3.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/2651-60d105cdcf6e0688.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/3014691f-c83e42d60ef11641.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/3073-52b48704297b1417.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/3215-9d9d4c9181338b52.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/3326-5d49da24b0b5d1f2.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/3342.0a6d008edf69d54c.js",revision:"0a6d008edf69d54c"},{url:"/_next/static/chunks/3526-82dc13f8f76279e3.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/3572-26ded475a32335d2.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/3744-b2bee0ce207217f5.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/3805-3eb0f732732247ec.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/406-9056be412683c6f4.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/4126-39e623ed947fb9b5.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/4468-4336af04b137aaa3.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/4526-28de029ac8b0094b.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/4844-6e368ec73af3142d.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/4bd1b696-6c4c935835e84c33.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/5182-197e6608971b02d5.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/5565-ca37877b10d93abb.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/5579-3f13999a03beca7e.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/60-56a677a4592a343a.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/6978-3d0b73304e837e45.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/6995-b08bf6c9ea405dc6.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/7434-65d88d3fc78bb90e.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/7880.586891adb22b684c.js",revision:"586891adb22b684c"},{url:"/_next/static/chunks/796.d0f64aa925a36220.js",revision:"d0f64aa925a36220"},{url:"/_next/static/chunks/8463-96b9827ad2793fd1.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/8629-340f27784d76c9ff.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/883-d5061b3065722c60.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/9048-90514de9ce57f0af.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/9410-fb2fe1907d015465.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/9606-e3c90b74c56ce7ec.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/9955-3472d7a6ed838d32.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/aaea2bcf-4651508e8ddff851.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/_not-found/page-c8499fd3ca479277.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/about/page-36f3eadaf876bfbc.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/agents/page-5e2a46f908868920.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/agent-matches/route-1f770f6b17b196bc.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/agent-process/route-07b6c4bcf0035c46.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/ai/summarize/route-8dcfbfed1e1a069b.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/applications/route-e5164ae7db5dc6b2.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/auth/github/callback/route-f1a2258d815e5f0c.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/bookmarks/route-21832dd0da08dad1.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/companies/%5Bname%5D/experiences/route-da60860d2717d2fe.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/companies/%5Bname%5D/follow/route-81c06ba1d61fbdd0.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/companies/%5Bname%5D/reviews/route-13eb9c058c075bf8.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/companies/%5Bname%5D/route-9651e3864d96371f.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/companies/job-postings-count/%5Bid%5D/route-81f7c429a1fd7eac.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/companies/route-7b470dc0bc2dcbed.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/csrf-token/route-fc594e2d2357815c.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/dashboard/applied-jobs/route-c97902949042e91c.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/dashboard/bookmarked-jobs/route-9ee833ff0242d79b.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/dashboard/featured-bookmark/route-e37f16e7f57faee4.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/dashboard/matching-jobs/route-a06fd24b2d84f301.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/dashboard/recent-companies/route-17b1bc6fd7e9dd0d.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/dashboard/recently-viewed/route-d22298d35d6b320c.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/dashboard/similar-jobs/route-1dec98e00b2ad059.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/init/route-889000e8493a18aa.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/job-postings/%5Bid%5D/apply/route-a004aeb6748686cf.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/job-postings/%5Bid%5D/bookmark/route-aa84261ad7d6d0ae.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/job-postings/%5Bid%5D/report/route-5bef3c6f6036e89e.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/job-postings/%5Bid%5D/route-8280b90571f0ca54.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/job-postings/%5Bid%5D/view-status/route-dc0f88c9b5ec9569.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/job-postings/%5Bid%5D/view/route-f331a9de9eedb756.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/job-postings/by-saved-search/route-89afb84a9a4583fb.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/job-postings/count/route-96e7d5cfb1faca2b.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/job-postings/route-babde541cd33e584.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/job-postings/salary-range/route-6ed99cce4a4c9227.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/job-postings/similar-company/route-fd337eed14ed056b.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/job-postings/similar/route-6b6b2c796b0bcf27.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/job-postings/suggested/route-26c5911ec935c38f.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/job-postings/trending/route-207e3c2891269007.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/login/github/route-a8d883e8518a09f3.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/login/route-d372fa6fdd0c4756.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/notifications/count/route-3c4e9a2945361e4e.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/notifications/route-da47241f3385c787.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/register/route-5e4f370ff1eaab1b.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/saved-searches/route-9ce47f2076bf9ed8.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/user/awards/route-eceb7de8efff033e.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/user/certifications/route-ba4db5afd67ded75.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/user/education/route-cf2a4dcc59e5b0bb.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/user/experience/route-7e7d1df749b0b9d9.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/user/github/route-810aa3323b462d58.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/user/preferences/route-a1b8d47ae6882b94.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/user/profile/route-6b394e2da76cfd0b.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/user/projects/route-1c53212efc25cb78.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/users/%5Busername%5D/follow/route-8dc1e068b9347f36.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/users/%5Busername%5D/route-22e0fa82373a3308.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/api/users/suggested/route-d40302f842d993f5.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/companies/%5Bname%5D/page-1a64c5143297a8a8.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/dashboard/page-ddc0515a2aec5077.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/explore/page-5a3be8e2a0c07533.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/job-postings/%5Bid%5D/layout-1a5f66ac8c5b934e.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/job-postings/%5Bid%5D/page-f5647ade2bf4925b.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/job-postings/applied/page-58aa975e9d20f13e.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/job-postings/layout-2e92934f80f74463.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/job-postings/my-jobs/page-9174dbcc8e902f6d.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/job-postings/page-44b206c707cb2986.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/job-postings/saved-searches/page-494e134f5448af02.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/landing/page-ae1ca2065b59b72b.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/layout-6c97239bd4498548.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/login/page-5c56900e5f98b687.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/notifications/page-028416ba9ef45530.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/p/%5Busername%5D/edit/page-f2e090a93094f6f0.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/p/%5Busername%5D/friends/page-a89de16060cc741e.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/p/%5Busername%5D/page-45f6e983b7db82ac.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/page-c35ad8b07f896098.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/profile/%5Busername%5D/page-0c2492fa47efa542.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/profile/page-e3488561454cf664.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/register/page-a7ef56b1cb61694c.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/saved/page-55091f19ebf45439.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/app/test/page-a1f4235b8e46db98.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/framework-e06094a3c16326b8.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/main-app-ea55baf83015ad03.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/main-c1b9318f80735023.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/pages/_app-5f03510007f8ee45.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/pages/_error-8efa4fbf3acc0458.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/chunks/polyfills-42372ed130431b0a.js",revision:"846118c33b2c0e922d7b3a7676f81f6f"},{url:"/_next/static/chunks/webpack-6432f20da9f70445.js",revision:"rG34LDCE5zk_qX8ECkwyB"},{url:"/_next/static/css/83d779f32b32b22b.css",revision:"83d779f32b32b22b"},{url:"/_next/static/css/aa2c73bdefbb8864.css",revision:"aa2c73bdefbb8864"},{url:"/_next/static/css/b6fbd5a19c595766.css",revision:"b6fbd5a19c595766"},{url:"/_next/static/media/4473ecc91f70f139-s.p.woff",revision:"78e6fc13ea317b55ab0bd6dc4849c110"},{url:"/_next/static/media/463dafcda517f24f-s.p.woff",revision:"cbeb6d2d96eaa268b4b5beb0b46d9632"},{url:"/_next/static/rG34LDCE5zk_qX8ECkwyB/_buildManifest.js",revision:"250a086420c1e34a34db8f76c9e9fbcd"},{url:"/_next/static/rG34LDCE5zk_qX8ECkwyB/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/file.svg",revision:"d09f95206c3fa0bb9bd9fefabfd0ea71"},{url:"/globe.svg",revision:"2aaafa6a49b6563925fe440891e32717"},{url:"/icon-192x192.png",revision:"3be7b8b182ccd96e48989b4e57311193"},{url:"/logo.png",revision:"b8c9e70c59338d13865baa80423ce5ee"},{url:"/manifest.json",revision:"d75702c7199a34c44565d876c2c32813"},{url:"/next.svg",revision:"8e061864f388b47f33a1c3780831193e"},{url:"/robots.txt",revision:"cfbee26e6ccb04a2cec30aac9f173295"},{url:"/sitemap-index.xml",revision:"094a9c9e609c0eb75e14f3caee658d84"},{url:"/vercel.svg",revision:"c0af2f507b369b085b35ef4bbe3bcf1e"},{url:"/window.svg",revision:"a2760511c65806022ad20adf74370ff3"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:i,state:a})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));
