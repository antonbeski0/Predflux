
import React, { useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';

// Neuron component
const Neuron = ({ position }) => (
  <mesh position={position}>
    <sphereGeometry args={[0.1, 16, 16]} />
    <meshStandardMaterial color="royalblue" emissive="royalblue" emissiveIntensity={0.5} />
  </mesh>
);

const getNeuronPositions = (count, position) => {
    const neurons = [];
    const numRows = Math.ceil(Math.sqrt(count));
    const numCols = Math.ceil(count / numRows);
    const spacing = 0.5;

    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / numCols);
        const col = i % numCols;
        const x = (col - (numCols - 1) / 2) * spacing + position[0];
        const y = (row - (numRows - 1) / 2) * spacing + position[1];
        neurons.push(new THREE.Vector3(x, y, position[2]));
    }
    return neurons;
};

// Layer component
const Layer = ({ positions }) => {
    return (
        <group>
            {positions.map((pos, i) => <Neuron key={i} position={pos} />)}
        </group>
    );
};

const Connections = ({ from, to, weights }) => {
    if (!weights) return null;

    const lines = [];
    if (weights) {
        for (let i = 0; i < from.length; i++) {
            for (let j = 0; j < to.length; j++) {
                const weight = weights[i] ? (weights[i][j] || 0) : 0;
                const color = weight > 0 ? '#0f0' : '#f00';
                const start = from[i];
                const end = to[j];
                lines.push(<Line key={`${i}-${j}`} points={[start, end]} color={color} lineWidth={0.5 + Math.abs(weight)} />);
            }
        }
    }


    return <group>{lines}</group>;
};


const NeuralNetwork3D = ({ model }) => {
  const [weights, setWeights] = useState(null);

  useEffect(() => {
    if (model) {
      // Get weights as arrays.
      const modelWeights = model.layers.map(layer => layer.getWeights().map(w => w.arraySync()));
      setWeights(modelWeights);
    }
  }, [model]);

  const layerPositions = {
      input: [-3, 0, 0],
      lstm: [0, 0, 0],
      output: [3, 0, 0],
  };

  const layerNeuronCounts = {
      input: 8,
      lstm: 32,
      output: 1,
  };

  const inputNeuronPositions = useMemo(() => getNeuronPositions(layerNeuronCounts.input, layerPositions.input), []);
  const lstmNeuronPositions = useMemo(() => getNeuronPositions(layerNeuronCounts.lstm, layerPositions.lstm), []);
  const outputNeuronPositions = useMemo(() => getNeuronPositions(layerNeuronCounts.output, layerPositions.output), []);

  const denseWeights = weights ? weights[1][0] : null;

  return (
    <Canvas camera={{ position: [0, 0, 8] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls />
      <group>
        {/* Layers */}
        <Layer positions={inputNeuronPositions} />
        <Layer positions={lstmNeuronPositions} />
        <Layer positions={outputNeuronPositions} />

        {/* Connections */}
        <Connections from={lstmNeuronPositions} to={outputNeuronPositions} weights={denseWeights} />
      </group>
    </Canvas>
  );
};

export default NeuralNetwork3D;
