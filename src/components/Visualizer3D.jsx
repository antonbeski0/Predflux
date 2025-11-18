import React, {useRef, useEffect} from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three';

function Asset({asset, predictions, color}){
  const ref = useRef()
  useFrame((state,delta)=>{
    if(ref.current) ref.current.rotation.y += delta*0.1
  })
  const nodes = []
  const size = 12
  for(let x=0;x<size;x++){
    for(let y=0;y<size;y++){
      const i = x*size+y
      const h = asset.series ? (asset.series[i % asset.series.length]*2 -1) : 0
      nodes.push({pos:[(x-size/2)/2, h, (y-size/2)/2]})
    }
  }

  const predSeries = predictions.find(p => p.asset === asset.name)?.predictions;

  return (
    <group ref={ref}>
      {nodes.map((n,i)=> (
        <mesh key={i} position={n.pos}>
          <sphereGeometry args={[0.06,8,8]} />
          <meshStandardMaterial emissive={color} color={'#0b2f3a'} />
        </mesh>
      ))}
      {predSeries && (
        <linePosition series={predSeries} color={color} />
      )}
    </group>
  )
}

function linePosition({series, color}) {
    const points = [];
    const size = 12;
    for(let i=0; i<series.length; i++){
        const x = Math.floor(i/size);
        const y = i%size;
        points.push(new THREE.Vector3((x-size/2)/2, series[i]*2-1, (y-size/2)/2));
    }
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    return (
        <line geometry={lineGeometry}>
            <lineBasicMaterial color={color} linewidth={2} />
        </line>
    )
}

export default function Visualizer3D({assets, predictions}){
    const colors = ['#5ee7ff', '#ff5e5e', '#5eff8a', '#ffea5e', '#c55eff'];
  return (
    <Canvas key={assets.length} camera={{position:[0,3,8]}}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5,5,5]} intensity={0.6} />
      {assets.map((asset, index) => 
        <Asset 
            key={index} 
            asset={asset} 
            predictions={predictions || []} 
            color={colors[index % colors.length]} 
        />
      )}
      <OrbitControls />
    </Canvas>
  )
}