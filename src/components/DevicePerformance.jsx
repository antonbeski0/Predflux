import React, { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

export default function DevicePerformance() {
  const [backend, setBackend] = useState('');

  useEffect(() => {
    async function setupBackend() {
      try {
        if (tf.backend().isGPUDevice) {
          await tf.setBackend('webgl');
        } else {
          await tf.setBackend('wasm');
        }
        setBackend(tf.getBackend());
      } catch (e) {
        console.error("Error setting up backend:", e);
        setBackend('cpu');
      }
    }
    setupBackend();
  }, []);

  return (
    <div>
      <h3>Device Performance</h3>
      <p>TensorFlow.js Backend: <strong>{backend}</strong></p>
    </div>
  );
}
