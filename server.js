const express=require('express');const http=require('http');const{Server}=require('socket.io');
const app=express(),server=http.createServer(app),io=new Server(server,{cors:{origin:'*'}});app.use(express.static('public'));const rooms=new Map();
function code(){let c;do c=Math.random().toString(36).slice(2,6).toUpperCase();while(rooms.has(c));return c}
function state(r){return{code:r.code,started:r.started,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,x:p.x,z:p.z,ry:p.ry,hp:p.hp,alive:p.alive}))}}
io.on('connection',s=>{
 s.on('createRoom',d=>{const c=code(),r={code:c,started:false,players:new Map()};rooms.set(c,r);r.players.set(s.id,{id:s.id,name:(d.name||'Nova').slice(0,16),x:0,z:8,ry:0,hp:100,alive:true});s.join(c);s.data.room=c;s.emit('roomCreated',{code:c});io.to(c).emit('state',state(r))});
 s.on('joinRoom',d=>{const c=String(d.code||'').toUpperCase(),r=rooms.get(c);if(!r)return s.emit('errorMsg','Room not found.');if(r.players.size>=6)return s.emit('errorMsg','Room is full.');r.players.set(s.id,{id:s.id,name:(d.name||'Runner').slice(0,16),x:(r.players.size-1)*3-6,z:8,ry:0,hp:100,alive:true});s.join(c);s.data.room=c;io.to(c).emit('state',state(r))});
 s.on('startGame',()=>{const r=rooms.get(s.data.room);if(!r)return;r.started=true;io.to(r.code).emit('started');io.to(r.code).emit('state',state(r))});
 s.on('move',d=>{const r=rooms.get(s.data.room),p=r?.players.get(s.id);if(!p||!p.alive)return;const x=Number(d.x),z=Number(d.z),ry=Number(d.ry);if(![x,z,ry].every(Number.isFinite))return;p.x=Math.max(-47,Math.min(47,x));p.z=Math.max(-47,Math.min(47,z));p.ry=ry;io.to(r.code).emit('state',state(r))});
 s.on('chat',m=>{const r=rooms.get(s.data.room);if(!r)return;const p=r.players.get(s.id);io.to(r.code).emit('chat',{name:p?.name||'Player',msg:String(m||'').slice(0,180)})});
 s.on('disconnect',()=>{const r=rooms.get(s.data.room);if(!r)return;r.players.delete(s.id);if(!r.players.size)rooms.delete(r.code);else io.to(r.code).emit('state',state(r))});
});
const PORT=process.env.PORT||10000;server.listen(PORT,'0.0.0.0',()=>console.log(`TIMEFALL 3D running on port ${PORT}`));
