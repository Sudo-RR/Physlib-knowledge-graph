// Preserve old source-inspector deep links; ordinary visits open Geneva G1.
const params=new URLSearchParams(location.search);
const legacy=['node','floor','district','visual','assetFixture','layout','explore'].some(key=>params.has(key));
const v2=params.has('demo');
location.replace(`${legacy?'city-c4.html':v2?'city-v2.html':'index.html'}${location.search}${location.hash}`);
