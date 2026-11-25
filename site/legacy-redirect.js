// Preserve old source-inspector deep links; ordinary visits open Geneva G1.
const params=new URLSearchParams(location.search);
const legacy=['node','floor','district','visual','assetFixture','layout','explore'].some(key=>params.has(key));
location.replace(`${legacy?'city-c4.html':'index.html'}${location.search}${location.hash}`);
