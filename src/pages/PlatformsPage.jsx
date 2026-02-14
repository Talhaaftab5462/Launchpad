import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { C, Panel, SectionHeader, RsiButton, RsiSpinner, HexBadge, PlatformSVG } from '../components/ui/RSI'
import { PLATFORM_META } from '../data/constants'
import { useToast } from '../hooks/useToast'

const isElectron = typeof window.launchpad !== 'undefined'

const PLATFORMS = [
  { key:'rsi',      name:'RSI Launcher',         accent:'#00d4ff', featured:true,  authType:'credentials', desc:'Roberts Space Industries launcher for Star Citizen and Squadron 42.', fields:[{key:'email',label:'RSI Email',placeholder:'your@email.com',type:'email'},{key:'password',label:'RSI Password',placeholder:'••••••••',type:'password'}], helpText:'Credentials used only for login and never stored.' },
  { key:'steam',    name:'Steam',                 accent:'#66c0f4', authType:'apikey',      desc:'Imports your full Steam library with playtime via Web API.', fields:[{key:'apiKey',label:'Steam Web API Key',placeholder:'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',type:'password'},{key:'steamId',label:'SteamID64',placeholder:'76561198XXXXXXXXX',type:'text'}], helpText:'Get API key at steamcommunity.com/dev/apikey · Find SteamID64 at steamid.io' },
  { key:'epic',     name:'Epic Games',            accent:'#0078f2', authType:'apikey',      desc:'Connect via Epic Developer credentials to import your Epic library.', fields:[{key:'clientId',label:'Client ID',placeholder:'Epic Client ID',type:'text'},{key:'clientSecret',label:'Client Secret',placeholder:'Epic Client Secret',type:'password'}], helpText:'Create a client at dev.epicgames.com/portal' },
  { key:'gog',      name:'GOG Galaxy',            accent:'#a855f7', authType:'oauth',       desc:'Sign in to GOG via OAuth to import your DRM-free library. Opens a browser window.' },
  { key:'battle',   name:'Battle.net',            accent:'#00b4ff', authType:'apikey',      desc:'Connect via Blizzard OAuth credentials to import Blizzard titles.', fields:[{key:'clientId',label:'Client ID',placeholder:'Blizzard Client ID',type:'text'},{key:'clientSecret',label:'Client Secret',placeholder:'Client Secret',type:'password'}], helpText:'Create app at develop.battle.net/access/clients/create' },
  { key:'xbox',     name:'Xbox / Game Pass',      accent:'#52b043', authType:'oauth',       desc:'Sign in with your Microsoft account via OAuth. Opens browser.' },
  { key:'rockstar', name:'Rockstar Social Club',  accent:'#f7c231', authType:'credentials', desc:'Enter your Social Club credentials to browse the Rockstar PC catalog and select games you own. Adds them directly to your library.', fields:[{key:'email',label:'Social Club Email',placeholder:'your@email.com',type:'email'},{key:'password',label:'Social Club Password',placeholder:'••••••••',type:'password'}], helpText:'Note: Rockstar has no public API - you will select your owned games from their PC catalog.' },
  { key:'itchio',   name:'itch.io',               accent:'#fa5c5c', authType:'apikey',      desc:'Import your purchased indie games via itch.io API key.', fields:[{key:'apiKey',label:'itch.io API Key',placeholder:'Paste your API key',type:'password'}], helpText:'Generate key at itch.io/user/settings/api-keys' },
  { key:'ubisoft',  name:'Ubisoft Connect',       accent:'#6366f1', authType:'manual',      desc:'No public API available. Add Ubisoft games manually using + Add Game.' },
  { key:'ps',       name:'PlayStation',           accent:'#0070d1', authType:'manual',      desc:'No PC game library API. Add PlayStation titles manually to track them.' },
  { key:'emulator', name:'Emulators / RetroArch', accent:'#f59e0b', authType:'folder',      desc:'Scan a local folder for ROMs. Supports N64, SNES, GBA, PS1, and more.', fields:[{key:'folderPath',label:'ROM Folder',placeholder:'C:\\ROMs',type:'text'}] },
]

const INP_BASE = { width:'100%', background:'#060e18', border:`1px solid ${C.border}`, color:C.text, padding:'9px 12px', fontSize:13, outline:'none', fontFamily:"'Share Tech Mono',monospace", letterSpacing:'0.02em', transition:'border-color 0.15s' }

function ConnectModal({ platform, savedProfile, onClose, onSuccess }) {
  const [fields, setFields] = useState({})
  const [step, setStep]     = useState('form')
  const [error, setError]   = useState('')
  const [mfaCode, setMfa]   = useState('')
  const [mfaSession, setMfaSess] = useState(null)
  const [mfaEmail, setMfaEmail]  = useState('')
  const [result, setResult] = useState(null)
  // Rockstar game picker
  const [catalog, setCatalog]   = useState([])
  const [selected, setSelected] = useState(new Set())
  const acc = platform.accent

  const sf = (k,v) => setFields(f=>({...f,[k]:v}))

  async function go() {
    setStep('connecting'); setError('')
    try {
      let res
      if (!isElectron) {
        await new Promise(r=>setTimeout(r,1600))
        // Simulate RSI MFA in browser demo
        if (platform.key === 'rsi') {
          res = { success:false, requiresMFA:true, sessionId:'demo-session', email:fields.email }
        } else if (platform.key === 'rockstar') {
          res = { success:false, needsGamePicker:true, profile:{name:(fields.email||'').split('@')[0]||'Rockstar User'}, catalog:[
            {title:'Grand Theft Auto V',platform:'rockstar',coverUrl:'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_600x900.jpg',backgroundUrl:'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_hero.jpg',status:'playing',genre:['Action','Open World'],developer:'Rockstar North',publisher:'Rockstar Games',releaseYear:2015,description:'Grand Theft Auto V for PC.',playtime:0,tags:['open-world','crime'],notes:''},
            {title:'Red Dead Redemption 2',platform:'rockstar',coverUrl:'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/library_600x900.jpg',backgroundUrl:'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/library_hero.jpg',status:'backlog',genre:['Action','Western'],developer:'Rockstar Games',publisher:'Rockstar Games',releaseYear:2019,description:'Red Dead Redemption 2 on PC.',playtime:0,tags:['western','open-world'],notes:''},
            {title:'Grand Theft Auto IV',platform:'rockstar',coverUrl:'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/12210/library_600x900.jpg',backgroundUrl:'',status:'backlog',genre:['Action','Open World'],developer:'Rockstar North',publisher:'Rockstar Games',releaseYear:2008,description:'Liberty City.',playtime:0,tags:['open-world','crime'],notes:''},
            {title:'Max Payne 3',platform:'rockstar',coverUrl:'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/204100/library_600x900.jpg',backgroundUrl:'',status:'backlog',genre:['Action','Shooter'],developer:'Rockstar Studios',publisher:'Rockstar Games',releaseYear:2012,description:'Bullet-time shooter.',playtime:0,tags:['shooter','noir'],notes:''},
            {title:'L.A. Noire',platform:'rockstar',coverUrl:'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/110800/library_600x900.jpg',backgroundUrl:'',status:'backlog',genre:['Detective','Open World'],developer:'Team Bondi',publisher:'Rockstar Games',releaseYear:2011,description:'1940s detective thriller.',playtime:0,tags:['detective','noir'],notes:''},
            {title:'Bully: Scholarship Edition',platform:'rockstar',coverUrl:'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/12200/library_600x900.jpg',backgroundUrl:'',status:'backlog',genre:['Action','Open World'],developer:'Rockstar Vancouver',publisher:'Rockstar Games',releaseYear:2008,description:'Bullworth Academy.',playtime:0,tags:['open-world','comedy'],notes:''},
          ], message:"Rockstar doesn't allow third-party API access. Select the games you own to add them to your library." }
        } else {
          res = { success:true, profile:{ name:`${platform.name} User` }, gameCount:0, games:[] }
        }
      } else {
        const fn = { steam:'connectSteam', rsi:'connectRSI', epic:'connectEpic', gog:'connectGOG', itchio:'connectItchio', xbox:'connectXbox', battle:'connectBattle', rockstar:'connectRockstar', ubisoft:'connectUbisoft', ps:'connectPS', emulator:'connectEmulator' }[platform.key]
        const args = { steam:{apiKey:fields.apiKey,steamId:fields.steamId}, rsi:{email:fields.email,password:fields.password}, epic:{clientId:fields.clientId,clientSecret:fields.clientSecret}, gog:undefined, itchio:{apiKey:fields.apiKey}, xbox:undefined, battle:{clientId:fields.clientId,clientSecret:fields.clientSecret}, rockstar:{email:fields.email,password:fields.password}, ubisoft:undefined, ps:undefined, emulator:{folderPath:fields.folderPath} }[platform.key]
        res = args !== undefined ? await window.launchpad[fn](args) : await window.launchpad[fn]()
      }
      if (res.requiresMFA) {
        setMfaSess(res.sessionId || null)
        setMfaEmail(res.email || fields.email || '')
        setStep('mfa')
        return
      }
      if (res.needsGamePicker) {
        setCatalog(res.catalog || [])
        setSelected(new Set())
        setResult({ profile: res.profile, message: res.message })
        setStep('gamepicker')
        return
      }
      if (res.needsManual) { setError(res.error); setStep('manual'); return }
      if (res.success)     { setResult({...res, _fields: fields}); setStep('success') }
      else                 { setError(res.error||'Connection failed'); setStep('error') }
    } catch(e) { setError(e.message); setStep('error') }
  }

  async function doMFA() {
    setStep('connecting')
    try {
      const res = isElectron
        ? await window.launchpad.connectRSIMFA({code:mfaCode, sessionId:mfaSession, email:mfaEmail})
        : {success:true, profile:{name:'RSI User', handle:'citizen'}, games:[
            {title:'Star Citizen',platform:'rsi',coverUrl:'https://robertsspaceindustries.com/media/z2vo2a913vja6r/store_small/Star-Citizen-Box-Art.jpg',status:'playing',genre:['Space Sim','FPS','MMO'],developer:'Cloud Imperium Games',publisher:'Cloud Imperium Games',releaseYear:2013,description:'An ambitious space simulation MMO.',playtime:0,tags:['space','mmo'],notes:''},
            {title:'Squadron 42',platform:'rsi',coverUrl:'',status:'backlog',genre:['Space Sim','FPS','Story'],developer:'Cloud Imperium Games',publisher:'Cloud Imperium Games',releaseYear:null,description:'Single-player campaign.',playtime:0,tags:['space','campaign'],notes:''},
          ]}
      if (res.success) { setResult(res); setStep('success') }
      else { setError(res.error||'Invalid or expired code'); setStep('mfa') }
    } catch(e) { setError(e.message); setStep('mfa') }
  }

  function confirmGamePicker() {
    const chosenGames = catalog.filter((_,i) => selected.has(i))
    onSuccess({ success:true, profile: result?.profile || {name:'Rockstar User'}, games: chosenGames })
    onClose()
  }

  function toggleGame(i) {
    setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(4,8,14,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,backdropFilter:'blur(6px)'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <motion.div initial={{opacity:0,scale:0.96,y:10}} animate={{opacity:1,scale:1,y:0}}
        style={{background:'#080f1a',border:`1px solid ${acc}44`,width:'100%',maxWidth:500,padding:28,clipPath:'polygon(16px 0%,100% 0%,100% calc(100% - 16px),calc(100% - 16px) 100%,0% 100%,0% 16px)',boxShadow:`0 24px 80px rgba(0,0,0,0.9),0 0 40px ${acc}0a`,position:'relative'}}>
        <div style={{position:'absolute',top:0,left:0,width:16,height:16,borderTop:`2px solid ${acc}`,borderLeft:`2px solid ${acc}`}}/>
        <div style={{position:'absolute',bottom:0,right:0,width:16,height:16,borderBottom:`2px solid ${acc}55`,borderRight:`2px solid ${acc}55`}}/>
        <div style={{position:'absolute',top:0,left:16,right:0,height:1,background:`linear-gradient(to right,${acc},transparent)`}}/>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
          <div style={{width:48,height:48,background:`${acc}15`,border:`1px solid ${acc}44`,display:'flex',alignItems:'center',justifyContent:'center',clipPath:'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)',flexShrink:0}}>
            <PlatformSVG platform={platform.key} size={24} color={acc}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:16,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.textBright}}>{platform.name}</div>
            {savedProfile && <HexBadge color={C.success} style={{fontSize:9,marginTop:3}}>CONNECTED AS {savedProfile.name?.toUpperCase()}</HexBadge>}
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.textDim,cursor:'pointer',padding:4,transition:'color 0.15s'}} onMouseEnter={e=>e.currentTarget.style.color=acc} onMouseLeave={e=>e.currentTarget.style.color=C.textDim}><Icon name="x" size={16}/></button>
        </div>

        {/* FORM */}
        {step==='form' && (
          <>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:C.textDim,lineHeight:1.6,marginBottom:16,padding:'10px 12px',background:`${acc}08`,border:`1px solid ${acc}22`}}>
              {platform.desc}{platform.helpText&&<div style={{marginTop:6,color:C.textDim+'cc'}}>{platform.helpText}</div>}
            </div>
            {platform.authType==='manual' ? (
              <div style={{textAlign:'center',padding:'8px 0 16px'}}><HexBadge color={C.textDim}>MANUAL ONLY - NO API AVAILABLE</HexBadge><div style={{marginTop:16}}><RsiButton onClick={onClose} variant="ghost" size="sm">CLOSE</RsiButton></div></div>
            ) : platform.authType==='oauth' ? (
              <><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:C.textDim,marginBottom:16,lineHeight:1.6}}>A secure browser window will open. No credentials are stored in Launchpad.</div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><RsiButton onClick={onClose} variant="ghost" size="sm">CANCEL</RsiButton><RsiButton onClick={go} variant="solid" size="sm" accent={acc}>OPEN {platform.name.toUpperCase()} LOGIN</RsiButton></div></>
            ) : platform.authType==='folder' ? (
              <><div style={{marginBottom:14}}>
                <label style={{fontFamily:"'Rajdhani',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textDim,display:'block',marginBottom:6}}>ROM FOLDER PATH</label>
                <div style={{display:'flex',gap:8}}>
                  <input style={{...INP_BASE,flex:1}} value={fields.folderPath||''} onChange={e=>sf('folderPath',e.target.value)} placeholder="C:\ROMs" onFocus={e=>e.target.style.borderColor=acc} onBlur={e=>e.target.style.borderColor=C.border}/>
                  {isElectron&&<button onClick={async()=>{const p=await window.launchpad.pickFolder();if(p)sf('folderPath',p)}} style={{padding:'9px 14px',background:'transparent',border:`1px solid ${C.border}`,color:C.textDim,cursor:'pointer',fontFamily:"'Rajdhani',sans-serif",fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:5}}><Icon name="search" size={12} color={C.textDim}/> BROWSE</button>}
                </div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><RsiButton onClick={onClose} variant="ghost" size="sm">CANCEL</RsiButton><RsiButton onClick={go} variant="solid" size="sm" accent={acc}>SCAN FOLDER</RsiButton></div></>
            ) : (
              <>{platform.fields?.map(f=>(
                <div key={f.key} style={{marginBottom:14}}>
                  <label style={{fontFamily:"'Rajdhani',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textDim,display:'block',marginBottom:6}}>{f.label}</label>
                  <input style={INP_BASE} type={f.type} value={fields[f.key]||''} onChange={e=>sf(f.key,e.target.value)} placeholder={f.placeholder} onFocus={e=>e.target.style.borderColor=acc} onBlur={e=>e.target.style.borderColor=C.border} onKeyDown={e=>e.key==='Enter'&&go()}/>
                </div>
              ))}
              <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}><RsiButton onClick={onClose} variant="ghost" size="sm">CANCEL</RsiButton><RsiButton onClick={go} variant="solid" size="sm" accent={acc}>CONNECT</RsiButton></div></>
            )}
          </>
        )}

        {/* CONNECTING */}
        {step==='connecting' && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'28px 0',gap:16}}>
            <RsiSpinner size={40} accent={acc}/>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:acc,letterSpacing:'0.1em'}}>{platform.authType==='oauth'?'WAITING FOR BROWSER LOGIN…':'AUTHENTICATING…'}</div>
          </div>
        )}

        {/* MFA */}
        {step==='mfa' && (
          <>
            <div style={{background:`${acc}08`,border:`1px solid ${acc}22`,padding:'12px 14px',marginBottom:16,display:'flex',gap:10,alignItems:'flex-start'}}>
              <div style={{width:32,height:32,background:`${acc}15`,border:`1px solid ${acc}33`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Icon name="mail" size={15} color={acc}/>
              </div>
              <div>
                <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:12,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:acc,marginBottom:4}}>EMAIL VERIFICATION REQUIRED</div>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:C.textDim,lineHeight:1.6}}>
                  RSI sent a 6-digit code to<br/>
                  <span style={{color:C.text}}>{mfaEmail || 'your email'}</span>
                </div>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontFamily:"'Rajdhani',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textDim,display:'block',marginBottom:8}}>ENTER VERIFICATION CODE</label>
              <input autoFocus style={{...INP_BASE,letterSpacing:'0.4em',fontSize:20,textAlign:'center',padding:'14px 12px',border:`1px solid ${mfaCode.length>=4?acc:C.border}`,textTransform:'uppercase'}} value={mfaCode} onChange={e=>setMfa(e.target.value.replace(/[^a-zA-Z0-9]/g,'').slice(0,8).toUpperCase())} placeholder="CODE" onFocus={e=>e.target.style.borderColor=acc} onBlur={e=>{if(mfaCode.length<4)e.target.style.borderColor=C.border}} onKeyDown={e=>e.key==='Enter'&&mfaCode.length>=4&&doMFA()}/>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:C.textDim,marginTop:6}}>{mfaCode.length} CHAR{mfaCode.length!==1?'S':''}{mfaCode.length>=4?' - READY TO VERIFY':' - ENTER CODE FROM EMAIL'}</div>
            </div>
            {error&&<div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',padding:'8px 12px',fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#fca5a5',marginBottom:12,lineHeight:1.5}}>{error}</div>}
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <RsiButton onClick={()=>{setStep('form');setMfa('');setError('')}} variant="ghost" size="sm">BACK</RsiButton>
              <RsiButton onClick={doMFA} variant="solid" size="sm" accent={acc} disabled={mfaCode.length<4}>VERIFY CODE</RsiButton>
            </div>
          </>
        )}

        {/* ROCKSTAR GAME PICKER */}
        {step==='gamepicker' && (
          <>
            <div style={{background:'#f7c23108',border:'1px solid #f7c23133',padding:'10px 14px',marginBottom:14,display:'flex',gap:10,alignItems:'flex-start'}}>
              <Icon name="info" size={15} color="#f7c231" style={{flexShrink:0,marginTop:1}}/>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#fde68a',lineHeight:1.6}}>{result?.message || "Select which Rockstar games you own to add them to your library."}</div>
            </div>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textDim,marginBottom:8}}>SELECT YOUR GAMES ({selected.size} SELECTED)</div>
            <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:260,overflowY:'auto',marginBottom:14,paddingRight:4}}>
              {catalog.map((g,i)=>{
                const sel = selected.has(i)
                return (
                  <div key={i} onClick={()=>toggleGame(i)} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 10px',background:sel?`${acc}0d`:'#060e18',border:`1px solid ${sel?acc+'55':C.border}`,cursor:'pointer',transition:'all 0.15s',clipPath:'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)'}}>
                    <div style={{width:20,height:20,border:`2px solid ${sel?acc:C.border}`,background:sel?acc:'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s',flexShrink:0}}>
                      {sel&&<Icon name="check" size={12} color="#080c12"/>}
                    </div>
                    {g.coverUrl?<img src={g.coverUrl} alt="" style={{width:28,height:40,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/>:<div style={{width:28,height:40,background:C.surface2,flexShrink:0}}/>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,color:sel?C.textBright:C.text,fontWeight:sel?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.title}</div>
                      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:C.textDim,marginTop:2}}>{g.releaseYear||'-'} · {g.genre?.[0]||'Game'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <button onClick={()=>setSelected(new Set(catalog.map((_,i)=>i)))} style={{flex:1,background:'transparent',border:`1px solid ${acc}33`,color:acc,padding:'6px',fontFamily:"'Rajdhani',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',cursor:'pointer'}}>SELECT ALL</button>
              <button onClick={()=>setSelected(new Set())} style={{flex:1,background:'transparent',border:`1px solid ${C.border}`,color:C.textDim,padding:'6px',fontFamily:"'Rajdhani',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',cursor:'pointer'}}>CLEAR</button>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <RsiButton onClick={onClose} variant="ghost" size="sm">CANCEL</RsiButton>
              <RsiButton onClick={confirmGamePicker} variant="solid" size="sm" accent={acc} disabled={selected.size===0}>ADD {selected.size} GAME{selected.size!==1?'S':''}</RsiButton>
            </div>
          </>
        )}

        {/* ERROR */}
        {step==='error' && (
          <><div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.3)',padding:'12px 14px',marginBottom:16,display:'flex',gap:10,alignItems:'flex-start'}}>
            <Icon name="x" size={16} color="#ef4444" style={{flexShrink:0,marginTop:1}}/>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#fca5a5',lineHeight:1.6}}>{error}</div>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><RsiButton onClick={()=>setStep('form')} variant="ghost" size="sm">RETRY</RsiButton><RsiButton onClick={onClose} variant="ghost" size="sm">CLOSE</RsiButton></div></>
        )}

        {/* MANUAL FALLBACK */}
        {step==='manual' && (
          <><div style={{background:'#f59e0b0a',border:'1px solid #f59e0b33',padding:'12px 14px',marginBottom:16,display:'flex',gap:10,alignItems:'flex-start'}}>
            <Icon name="info" size={16} color="#f59e0b" style={{flexShrink:0,marginTop:1}}/>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#fde68a',lineHeight:1.6}}>{error}</div>
          </div>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:C.textDim,lineHeight:1.6,marginBottom:16}}>We'll mark {platform.name} as connected. Add your games manually using + ADD GAME.</div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><RsiButton onClick={onClose} variant="ghost" size="sm">CANCEL</RsiButton><RsiButton onClick={()=>{onSuccess({success:true,profile:{name:platform.name+' (Manual)'},games:[]});onClose()}} variant="primary" size="sm" accent={acc}>CONNECT MANUALLY</RsiButton></div></>
        )}

        {/* SUCCESS */}
        {step==='success' && result && (
          <><div style={{background:'rgba(0,229,160,0.06)',border:'1px solid rgba(0,229,160,0.3)',padding:'12px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
            <Icon name="check" size={16} color={C.success}/>
            <div>
              <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:13,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.success}}>CONNECTED - {result.profile?.name?.toUpperCase()}</div>
              {result.gameCount>0&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:C.textDim,marginTop:3}}>{result.gameCount} GAMES IN LIBRARY</div>}
            </div>
          </div>
          {result.games?.length>0 ? (
            <><div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:10,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textDim,marginBottom:8}}>IMPORTING {result.games.length} GAME{result.games.length!==1?'S':''}</div>
            <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:200,overflowY:'auto',marginBottom:14}}>
              {result.games.slice(0,20).map((g,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 10px',background:'#060e18',border:`1px solid ${C.border}`,clipPath:'polygon(3px 0%,100% 0%,100% calc(100% - 3px),calc(100% - 3px) 100%,0% 100%,0% 3px)'}}>
                  {g.coverUrl?<img src={g.coverUrl} alt="" style={{width:24,height:34,objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/>:<div style={{width:24,height:34,background:C.surface2,flexShrink:0}}/>}
                  <span style={{fontSize:12,color:C.text,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.title}</span>
                  {g.playtime>0&&<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:acc,flexShrink:0}}>{Math.floor(g.playtime/60)}h</span>}
                </div>
              ))}
              {result.games.length>20&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:C.textDim,textAlign:'center',padding:'4px 0'}}>+{result.games.length-20} MORE</div>}
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <RsiButton onClick={()=>{onSuccess({...result,games:[]});onClose()}} variant="ghost" size="sm">SKIP IMPORT</RsiButton>
              <RsiButton onClick={()=>{onSuccess(result);onClose()}} variant="solid" size="sm" accent={acc}>IMPORT {result.games.length} GAME{result.games.length!==1?'S':''}</RsiButton>
            </div></>
          ) : (
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><RsiButton onClick={()=>{onSuccess(result);onClose()}} variant="solid" size="sm" accent={acc}>DONE</RsiButton></div>
          )}</>
        )}
      </motion.div>
    </div>
  )
}

export default function PlatformsPage({ connectedPlatforms, onConnect, onImportGames, platformProfiles, onSaveProfile, accent=C.accent }) {
  const [connecting, setConnecting] = useState(null)
  const toast = useToast()

  const featured = PLATFORMS.find(p=>p.featured)
  const rest      = PLATFORMS.filter(p=>!p.featured)

  function handleSuccess(platform, result) {
    onConnect(platform.key, true)
    if (result.profile && onSaveProfile) {
      // For Steam: persist apiKey + steamId so friends feed can use them
      const profileToSave = { ...result.profile }
      if (platform.key === 'steam' && result._fields) {
        profileToSave.apiKey  = result._fields.apiKey
        profileToSave.steamId = result._fields.steamId
        // Also write dedicated creds key for useSteamFriends hook
        try { window.storage.set('launchpad_steam_creds', JSON.stringify({ apiKey: result._fields.apiKey, steamId: result._fields.steamId })) } catch(e) {}
      }
      onSaveProfile(platform.key, profileToSave)
    }
    if (result.games?.length) { onImportGames(result.games); toast(`${result.games.length} game${result.games.length!==1?'s':''} imported from ${platform.name}`,'success') }
    else toast(`${platform.name} connected`,'success')
  }

  function Card({ p, big }) {
    const connected = connectedPlatforms.includes(p.key)
    const profile   = platformProfiles?.[p.key]
    const isManual  = p.authType==='manual'

    return (
      <motion.div whileHover={{y:-2}} style={big
        ? {marginBottom:14,background:'linear-gradient(135deg,#050d18,#080f1e)',border:`1px solid ${p.accent}55`,clipPath:'polygon(16px 0%,100% 0%,100% calc(100% - 16px),calc(100% - 16px) 100%,0% 100%,0% 16px)',boxShadow:`0 0 40px ${p.accent}10`,overflow:'hidden',position:'relative'}
        : {background:C.surface,border:`1px solid ${connected?p.accent+'44':C.border}`,clipPath:'polygon(10px 0%,100% 0%,100% calc(100% - 10px),calc(100% - 10px) 100%,0% 100%,0% 10px)',padding:'14px 16px',display:'flex',flexDirection:'column',gap:10,transition:'border-color 0.2s',position:'relative'}}>
        {big&&<div style={{position:'absolute',inset:0,background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,212,255,0.012) 3px,rgba(0,212,255,0.012) 4px)',pointerEvents:'none'}}/>}
        <div style={{position:'absolute',top:0,left:0,width:big?16:10,height:big?16:10,borderTop:`2px solid ${p.accent}`,borderLeft:`2px solid ${p.accent}`}}/>
        <div style={{position:'absolute',bottom:0,right:0,width:big?16:10,height:big?16:10,borderBottom:`2px solid ${p.accent}44`,borderRight:`2px solid ${p.accent}44`}}/>

        <div style={{padding:big?'18px 22px':0,display:'flex',alignItems:'center',gap:big?18:12,position:'relative',flexWrap:big?'nowrap':'nowrap'}}>
          <div style={{width:big?52:38,height:big?52:38,background:`${p.accent}15`,border:`1px solid ${p.accent}44`,display:'flex',alignItems:'center',justifyContent:'center',clipPath:'polygon(5px 0%,100% 0%,100% calc(100% - 5px),calc(100% - 5px) 100%,0% 100%,0% 5px)',flexShrink:0}}>
            <PlatformSVG platform={p.key} size={big?26:18} color={p.accent}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
              <span style={{fontFamily:"'Rajdhani',sans-serif",fontSize:big?17:13,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:C.textBright}}>{p.name}</span>
              {big&&<HexBadge color={p.accent}>FEATURED</HexBadge>}
              {connected&&<HexBadge color={C.success}>ONLINE</HexBadge>}
              {isManual&&!connected&&<HexBadge color={C.textDim}>MANUAL</HexBadge>}
            </div>
            {profile&&connected&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:p.accent,marginBottom:3,letterSpacing:'0.06em'}}>{profile.name?.toUpperCase()}</div>}
            <p style={{fontSize:11,color:C.textDim,lineHeight:1.5,margin:0}}>{p.desc}</p>
          </div>
          <div style={{display:'flex',gap:7,flexShrink:0,flexDirection:'column'}}>
            {connected ? (
              <><RsiButton onClick={()=>setConnecting(p)} variant="primary" size="sm" accent={p.accent}>SYNC</RsiButton>
              <RsiButton onClick={()=>{onConnect(p.key,false);if(onSaveProfile)onSaveProfile(p.key,null);toast(`${p.name} disconnected`,'info')}} variant="ghost" size="sm">DISCONNECT</RsiButton></>
            ) : (
              <RsiButton onClick={()=>setConnecting(p)} variant={big?'solid':'primary'} size={big?'md':'sm'} accent={p.accent}>
                {isManual?'MARK CONNECTED':'CONNECT'}
              </RsiButton>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.2}} style={{padding:20,overflow:'auto',height:'100%'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div>
          <SectionHeader accent={accent}>Platform Connections</SectionHeader>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:C.textDim,marginTop:4,letterSpacing:'0.06em'}}>{connectedPlatforms.length} / {PLATFORMS.length} PLATFORMS ONLINE</div>
        </div>
        <div style={{display:'flex',gap:20}}>
          {[['CONNECTED',connectedPlatforms.length,accent],['AVAILABLE',PLATFORMS.length,C.textDim]].map(([l,v,c])=>(
            <div key={l} style={{textAlign:'right'}}>
              <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:22,fontWeight:700,color:c}}>{v}</div>
              <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:9,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textDim}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <Card p={featured} big/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:10}}>
        {rest.map(p=><Card key={p.key} p={p}/>)}
      </div>

      <AnimatePresence>
        {connecting && <ConnectModal platform={connecting} savedProfile={platformProfiles?.[connecting.key]} onClose={()=>setConnecting(null)} onSuccess={r=>handleSuccess(connecting,r)}/>}
      </AnimatePresence>
    </motion.div>
  )
}
