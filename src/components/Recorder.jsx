import React, {useRef, useState} from 'react'

export default function Recorder(){
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [captured, setCaptured] = useState(null)

  async function startRecording(){
    try{
      const s = await navigator.mediaDevices.getDisplayMedia({video:true, audio:false})
      setStream(s)
      if(videoRef.current){
        videoRef.current.srcObject = s
        videoRef.current.play()
      }
    }catch(e){
      alert('Screen capture permission denied or not available: '+e.message)
    }
  }

  function captureFrame(){
    if(!videoRef.current) return
    const v = videoRef.current
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    const ctx = c.getContext('2d')
    ctx.drawImage(v, 0, 0, c.width, c.height)
    const dataUrl = c.toDataURL('image/png')
    setCaptured(dataUrl)
  }

  function stop(){
    if(stream){
      stream.getTracks().forEach(t=>t.stop())
      setStream(null)
    }
  }

  return (
    <div>
      <div style={{display:'flex', gap:8}}>
        <button onClick={startRecording}>SCREEN SHARE</button>
        <button onClick={captureFrame} disabled={!stream}>Capture Frame</button>
        <button onClick={stop}>Stop</button>
      </div>
      <div style={{marginTop:8}}>
        <video ref={videoRef} style={{width:'100%', border:'1px solid #123', borderRadius:6}} controls muted></video>
      </div>
      {captured && (
        <div style={{marginTop:8}}>
          <div>Captured Frame (click to open)</div>
          <img src={captured} style={{width:'100%', cursor:'pointer', marginTop:6}} alt="captured" />
        </div>
      )}
    </div>
  )
}