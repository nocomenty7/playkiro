let cleanBjId = "https://play.sooplive.com/devil0108/296731033";
if (cleanBjId.includes('play.sooplive.')) {
  cleanBjId = cleanBjId.split(/play\.sooplive\.(?:co\.kr|com)\//)[1]?.split('/')[0]?.split('?')[0] || cleanBjId;
}
console.log("Parsed:", cleanBjId);
