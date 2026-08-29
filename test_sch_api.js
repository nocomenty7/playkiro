async function test() {
  const bjid = 'devil0108';
  const res = await fetch(`https://sch.sooplive.co.kr/api.php?m=live_info&bjid=${bjid}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const text = await res.text();
  console.log("SCH API Response:", text);
}
test().catch(console.error);
