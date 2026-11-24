// Preserve old deep links to the C.4 source inspector while new visits open v2.
const params=new URLSearchParams(location.search);
const legacy=['node','floor','district','visual','assetFixture','layout','explore'].some(key=>params.has(key));
location.replace(`${legacy?'city-c4.html':'index.html'}${location.search}${location.hash}`);
