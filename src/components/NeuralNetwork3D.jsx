
import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import * as THREE from 'three';

const Neuron = ({ position }) => (
    <mesh position={position}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#5ee7ff" emissive="#5ee7ff" emissiveIntensity={0.8} />
    </mesh>
);

const getNeuronPositions = (layer, layerIndex, layerSpacing) => {
    let count;
    if (layer.units) {
        count = layer.units;
    } else if (layer.outputShape) {
        // It's an array, e.g., [null, 32], take the second element
        count = Array.isArray(layer.outputShape) ? layer.outputShape[1] : 64;
    } else {
        count = 1; // Fallback for layers like Concatenate
    }

    const neurons = [];
    const numRows = Math.ceil(Math.sqrt(count));
    const numCols = Math.ceil(count / numRows);
    const spacing = 0.4;
    const z = layerIndex * layerSpacing;

    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / numCols);
        const col = i % numCols;
        const x = (col - (numCols - 1) / 2) * spacing;
        const y = (row - (numRows - 1) / 2) * spacing;
        neurons.push(new THREE.Vector3(x, y, z));
    }
    return neurons;
};

const Layer = ({ positions }) => (
    <group>
        {positions.map((pos, i) => <Neuron key={i} position={pos} />)}
    </group>
);

const Connections = ({ from, to, weights }) => {
    if (!weights || !weights[0] || !from || !to) {
        return null;
    }

    const [kernel] = weights; // weights is an array of tensors, we need the kernel (weights matrix)
    const lines = [];

    // Reduce the number of connections for performance
    const from_reduced = from.length > 20 ? from.filter((_,i) => i % Math.floor(from.length / 20) === 0) : from;
    const to_reduced = to.length > 20 ? to.filter((_,i) => i % Math.floor(to.length / 20) === 0) : to;


    for (let i = 0; i < from_reduced.length; i++) {
        for (let j = 0; j < to_reduced.length; j++) {
            const weight = kernel[i] ? (kernel[i][j] || 0) : 0;
            const opacity = Math.min(0.8, Math.abs(weight) * 2);
            if (opacity < 0.1) continue;
            const color = weight > 0 ? '#00ff00' : '#ff0000';
            const start = from_reduced[i];
            const end = to_reduced[j];
            lines.push(
                <Line
                    key={`${i}-${j}`}
                    points={[start, end]}
                    color={color}
                    lineWidth={0.5}
                    transparent
                    opacity={opacity}
                />
            );
        }
    }

    return <group>{lines}</group>;
};

const NeuralNetwork3D = ({ model }) => {
    const layerSpacing = 3;

    const networkLayout = useMemo(() => {
        if (!model) return null;

        const layers = [];
        const connections = [];

        const filteredLayers = model.layers.filter(layer =>
            !layer.name.includes('concatenate')
        );

        for (let i = 0; i < filteredLayers.length; i++) {
            const layer = filteredLayers[i];
            const positions = getNeuronPositions(layer, i, layerSpacing);
            layers.push({
                name: layer.name,
                positions,
            });

            if (i > 0) {
                const prevLayer = filteredLayers[i - 1];
                const weights = layer.getWeights().map(w => w.arraySync());
                connections.push({
                    from: layers[i-1].positions,
                    to: positions,
                    weights,
                });
            }
        }
        return { layers, connections };
    }, [model]);


    if (!networkLayout) {
        return (
             <div style={{width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <p>Train a model to see the visualization.</p>
            </div>
        );
    }

    return (
        <Canvas camera={{ position: [0, 0, (networkLayout.layers.length * layerSpacing) + 2] }}>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={0.5} />
            <OrbitControls />
            <group>
                {networkLayout.layers.map((layer, i) => (
                     <React.Fragment key={i}>
                        <Layer positions={layer.positions} />
                         <Text
                            position={[0, (Math.sqrt(layer.positions.length) * 0.4) / 2 + 0.5, i * layerSpacing]}
                            fontSize={0.3}
                            color="white"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {layer.name}
                        </Text>
                     </React.Fragment>
                ))}
                {networkLayout.connections.map((connection, i) => (
                    <Connections key={i} from={connection.from} to={connection.to} weights={connection.weights} />
                ))}
            </group>
        </Canvas>
    );
};

export default NeuralNetwork3D;
