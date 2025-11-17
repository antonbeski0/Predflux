import React, {useRef, useEffect} from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'

function Nodes({series,pred}){
  const ref = useRef()
  useFrame((state,delta)=>{
    if(ref.current) ref.current.rotation.y += delta*0.1
  })
  // create a grid of points and animate according to series
  const nodes = []
  const size = 12
  for(let x=0;x<size;x++){
    for(let y=0;y<size;y++){
      const i = x*size+y
      const h = series ? (series[i % series.length]*2 -1) : 0
      nodes.push({pos:[(x-size/2)/2, h, (y-size/2)/2]})
    }
  }
  return (
    <group ref={ref}>
      {nodes.map((n,i)=> (
        <mesh key={i} position={n.pos}>
          <sphereGeometry args={[0.06,8,8]} />
          <meshStandardMaterial emissive={'#66f3ff'} color={'#0b2f3a'} />
        </mesh>
      ))}
      {pred && (
        <linePosition series={pred} />
      )}
    </group>
  )
}

export default function Visualizer3D({series,pred}){
  return (
    <Canvas camera={{position:[0,3,8]}}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5,5,5]} intensity={0.6} />
      <Nodes series={series} pred={pred} />
      <OrbitControls />
    </Canvas>
  )
}