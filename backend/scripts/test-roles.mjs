const base = 'http://localhost:8443';
const email = 'Siraj@zynq.ocm';
const password = 'Admin@Siraj';
async function main(){
  const res = await fetch(`${base}/auth/login`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password})});
  const data = await res.json();
  if(!res.ok){
    console.error('Login failed', data);
    process.exit(1);
  }
  const token = data.accessToken;
  const r2 = await fetch(`${base}/roles`, { headers: { Authorization: `Bearer ${token}` } });
  const t2 = await r2.text();
  console.log('GET /roles', r2.status, t2);
}
main().catch(e=>{console.error(e); process.exit(1);});
