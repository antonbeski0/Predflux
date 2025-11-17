import React, {useRef, useState, useEffect} from 'react'

export default function Digitizer({onSeries}){
  const [imgSrc, setImgSrc] = useState(null)
  const canvasRef = useRef(null)
  const [points, setPoints] = useState([])

  // load captured image from page (user can paste data URL) or upload
  function handleUpload(e){
    const f = e.target.files[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = ()=> setImgSrc(reader.result)
    reader.readAsDataURL(f)
  }

  useEffect(()=>{
    if(!imgSrc) return
    const img = new Image()
    img.onload = ()=>{
      const c = canvasRef.current
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')
      ctx.drawImage(img,0,0)
    }
    img.src = imgSrc
  },[imgSrc])

  function handleClick(e){
    const c = canvasRef.current
    const rect = c.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setPoints(prev=>{
      const next = [...prev, {x,y}]
      // draw
      const ctx = c.getContext('2d')
      ctx.fillStyle = 'rgba(0,255,200,0.9)'
      ctx.beginPath()
      ctx.arc(x,y,4,0,Math.PI*2)
      ctx.fill()
      return next
    })
  }

  function clear(){
    setPoints([])
    if(!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    const img = new Image()
    img.onload = ()=> ctx.drawImage(img,0,0)
    img.src = imgSrc
  }

  function exportSeries(){
    if(points.length<2) { alert('Select at least 2 points'); return }
    // convert points to series: sort by x
    const sorted = [...points].sort((a,b)=>a.x-b.x)
    // map y to price by inverting y-axis: assume top is max, bottom is min
    const ys = sorted.map(p=>p.y)
    const maxY = Math.max(...ys)
    const minY = Math.min(...ys)
    const values = ys.map(y=> 1 - (y - minY) / (maxY - minY)) // normalized 0..1
    // produce evenly spaced time series
    onSeries(values)
    alert('Series exported as normalized values (0..1). You can now train the model.')
  }

  return (
    <div>
      <div style={{display:'flex', gap:8}}>
        <input type="file" accept="image/*" onChange={handleUpload} />
        <button onClick={clear}>Clear Points</button>
        <button onClick={exportSeries}>EXPORT SERIES</button>
      </div>
      <div style={{marginTop:8}}>
        {imgSrc ? (
          <canvas ref={canvasRef} style={{maxWidth:'100%', border:'1px solid #123'}} onClick={handleClick}></canvas>
        ) : (
          <div style={{padding:12, border:'1px dashed #234'}}>No image. Upload a captured frame or chart image and click along the price line to digitize points.</div>
        )}
      </div>
      <div style={{marginTop:6}}>Points: {points.length}</div>
    </div>
  )
}