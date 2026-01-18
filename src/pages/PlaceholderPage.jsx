import React from 'react'
import { motion } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { C, Panel, SectionHeader, HexBadge } from '../components/ui/RSI'

export default function PlaceholderPage({ title, icon, description, accent = C.accent }) {
  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:16 }}>
      <div style={{ width:72, height:72, background:`${accent}12`, border:`1px solid ${accent}28`, display:'flex', alignItems:'center', justifyContent:'center', clipPath:'polygon(10px 0%,100% 0%,100% calc(100% - 10px),calc(100% - 10px) 100%,0% 100%,0% 10px)', boxShadow:`0 0 24px ${accent}12` }}>
        <Icon name={icon} size={34} color={accent}/>
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:22, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:C.textDim, marginBottom:8 }}>{title}</div>
        <div style={{ fontSize:13, color:C.textDim, maxWidth:340, lineHeight:1.6, marginBottom:14 }}>{description}</div>
        <HexBadge color={accent}>Coming Soon</HexBadge>
      </div>
    </motion.div>
  )
}
