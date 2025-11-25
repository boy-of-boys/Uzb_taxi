import React, { useState, useEffect } from 'react';
import Login from './Login.jsx';
import MapPage from './MapPage.jsx';
import DriverPanel from './DriverPanel.jsx';

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);

  useEffect(() => {
    if (token) localStorage.setItem('token', token); else localStorage.removeItem('token');
    if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
  }, [token, user]);

  if (!token) return <Login onAuth={(t,u)=>{ setToken(t); setUser(u); }} />;

  // oddiy menyu: map yoki driver panel (agar driver bo'lsangiz)
  return (
    <div style={{height:'100%'}}>
      <div className="header">
        <div style={{fontSize:18, fontWeight:700}}>🚕 UzTaxi</div>
        <div style={{marginLeft:12}} className="small">Salom, {user.username}</div>
        <div style={{marginLeft:'auto'}}>
          <button className="btn" onClick={()=>{ localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.reload(); }}>Chiqish</button>
        </div>
      </div>
      <div className="container">
        <MapPage token={token} user={user} />
        <div style={{width:320, padding:12, boxSizing:'border-box', background:'#fff', borderLeft:'1px solid #eee'}}>
          <DriverPanel />
        </div>
      </div>
    </div>
  );
}