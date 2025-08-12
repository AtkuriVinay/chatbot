import React, { useEffect, useState } from 'react';
import { createClient as createNhostClient } from '@nhost/nhost-js';
import { ApolloClient, InMemoryCache, HttpLink, ApolloProvider, useMutation, useSubscription, gql } from '@apollo/client';

const nhost = createNhostClient({ backendUrl: import.meta.env.VITE_NHOST_BACKEND_URL || 'https://YOUR_NHOST_BACKEND_URL' });

const INSERT_MESSAGE = gql`mutation InsertMessage($chat_id: uuid!, $body: String!) { insert_messages_one(object: { chat_id: $chat_id, sender: "user", body: $body }) { id body created_at } }`;
const SEND_ACTION = gql`mutation SendMessage($chat_id: uuid!, $message_id: uuid!) { sendMessage(input: { chat_id: $chat_id, message_id: $message_id }) { bot_message_id body } }`;
const CREATE_CHAT = gql`mutation CreateChat($title: String!) { insert_chats_one(object: { title: $title, owner_id: "" }) { id title } }`;
const CHAT_LIST = gql`subscription ChatList { chats(order_by: { created_at: desc }) { id title created_at } }`;
const MESSAGES_SUB = gql`subscription MessagesInChat($chat_id: uuid!) { messages(where: { chat_id: { _eq: $chat_id } }, order_by: { created_at: asc }) { id sender body created_at } }`;

function createApolloClient(token) {
  const httpLink = new HttpLink({ uri: import.meta.env.VITE_HASURA_GRAPHQL_URL, headers: { Authorization: token ? `Bearer ${token}` : '' } });
  return new ApolloClient({ link: httpLink, cache: new InMemoryCache() });
}

function AuthUI({ onAuth }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  async function signUp(){ const { error } = await nhost.auth.signUp({ email, password }); if (error) return alert(error.message); alert('Signup success. Please sign in.'); }
  async function signIn(){ const { error } = await nhost.auth.signIn({ email, password }); if (error) return alert(error.message); const session = nhost.auth.getSession(); onAuth(session); }
  return (<div style={{padding:20}}><h3>Sign up / Sign in (email)</h3><input value={email} onChange={e=>setEmail(e.target.value)} placeholder='email' /><br/><input value={password} onChange={e=>setPassword(e.target.value)} placeholder='password' type='password' /><br/><button onClick={signUp}>Sign Up</button> <button onClick={signIn}>Sign In</button></div>);
}

function ChatList({ onSelect }) {
  const { data } = useSubscription(CHAT_LIST);
  const [title, setTitle] = useState('');
  const [createChat] = useMutation(CREATE_CHAT);
  async function handleCreate(){ if (!title.trim()) return; await createChat({ variables: { title } }); setTitle(''); }
  return (<div style={{width:300, borderRight:'1px solid #ccc', padding:12}}><h4>Chats</h4><div><input value={title} onChange={e=>setTitle(e.target.value)} placeholder='New chat title' /><button onClick={handleCreate}>Create</button></div><ul>{data?.chats?.map(c=>(<li key={c.id}><button onClick={()=>onSelect(c.id)}>{c.title || c.id}</button></li>))}</ul></div>);
}

function ChatView({ chatId }) {
  const [insertMessage] = useMutation(INSERT_MESSAGE);
  const [sendAction] = useMutation(SEND_ACTION);
  const { data } = useSubscription(MESSAGES_SUB, { variables: { chat_id: chatId }});
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);

  async function send(){ if (!text.trim()) return; const res = await insertMessage({ variables: { chat_id: chatId, body: text }}); const messageId = res.data.insert_messages_one.id; setText(''); setTyping(true); await sendAction({ variables: { chat_id: chatId, message_id: messageId }}); setTyping(false); }

  return (<div style={{flex:1, padding:12}}><h3>Chat</h3><div style={{height:300, overflow:'auto', border:'1px solid #ddd', padding:8}}>{data?.messages?.map(m=>(<div key={m.id}><b>{m.sender}:</b> {m.body}</div>))}</div>{typing && <div><em>Bot is typing...</em></div>}<div><input value={text} onChange={e=>setText(e.target.value)} placeholder='Type message...' style={{width:'70%'}}/><button onClick={send}>Send</button></div></div>);
}

export default function App(){
  const [session, setSession] = useState(null);
  const [client, setClient] = useState(null);
  const [chatId, setChatId] = useState(null);
  useEffect(()=>{ const s = nhost.auth.getSession(); if (s && s.accessToken && s.accessToken.accessToken) { setSession(s); const token = s.accessToken.accessToken; const ap = createApolloClient(token); setClient(ap);} },[]);
  if (!session || !client) return <AuthUI onAuth={(s)=>{ const token = s?.accessToken?.accessToken; const ap = createApolloClient(token); setSession(s); setClient(ap); }} />;
  return (<ApolloProvider client={client}><div style={{display:'flex', height:'100vh'}}><ChatList onSelect={setChatId}/>{chatId ? <ChatView chatId={chatId}/> : <div style={{padding:20}}>Select chat</div>}</div></ApolloProvider>);
}