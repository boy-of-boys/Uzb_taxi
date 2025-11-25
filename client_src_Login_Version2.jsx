import React, { useState } from 'react';

export default function Login({onAuth}){
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [mode,setMode]=useState('login');
  const api = (path, body) => fetch('http://localhost:5000/api/' + path, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)}).then(r=>r.json());

  async function submit(e){
    e.preventDefault();
    try {
      if (mode === 'register') {
        const res = await api('register', { username, password });
        if (res.token) onAuth(res.token, res.user);
      } else {
        const res = await api('login', { username, password });
        if (res.token) onAuth(res.token, res.user);
        else alert('Login failed');
      }
    } catch (e) { alert('Error'); }
  }

  return (
    <div style={{padding:20}}>
      <h2>UzTaxi — Kirish</h2>
      <form onSubmit={submit}>
        <input className="input" placeholder="Foydalanuvchi nomi" value={username} onChange={e=>setUsername(e.target.value)} />
        <input className="input" placeholder="Parol" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn" type="submit">{mode === 'login' ? 'Kirish' : 'Ro\'yxatdan o\'tish'}</button>
      </form>
      <div style={{marginTop:12}}>
        <button className="btn" onClick={()=>setMode(mode==='login'?'register':'login')}>Mode: {mode}</button>
      </div>
    </div>
  );
}