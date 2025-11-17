import React, { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

export default function DevicePerformance() {
  const [performanceInfo, setPerformanceInfo] = useState({
    backend: 'initializing...',
    tfjsVersion: '',
    gpuInfo: 'N/A',
    browser: '',
    os: '',
  });

  useEffect(() => {
    async function getPerformanceInfo() {
      try {
        // Setup backend
        await tf.ready();
        const currentBackend = tf.getBackend();

        // Get GPU Info
        let gpuInfo = 'N/A';
        if (currentBackend === 'webgl') {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    gpuInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                }
            }
        }

        // Get Browser and OS
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        if (ua.indexOf("Firefox") > -1) {
            browser = "Mozilla Firefox";
        } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
            browser = "Opera";
        } else if (ua.indexOf("Trident") > -1) {
            browser = "Microsoft Internet Explorer";
        } else if (ua.indexOf("Edge") > -1) {
            browser = "Microsoft Edge";
        } else if (ua.indexOf("Chrome") > -1) {
            browser = "Google Chrome or Chromium";
        } else if (ua.indexOf("Safari") > -1) {
            browser = "Apple Safari";
        }

        const os = navigator.platform;


        setPerformanceInfo({
          backend: currentBackend,
          tfjsVersion: tf.version.tfjs,
          gpuInfo,
          browser,
          os,
        });

      } catch (e) {
        console.error("Error getting performance info:", e);
        setPerformanceInfo(prev => ({ ...prev, backend: 'cpu (error)' }));
      }
    }
    getPerformanceInfo();
  }, []);

  return (
    <div style={{textAlign: 'right', opacity: 0.7, color: 'white'}}>
      <p style={{margin: 0, fontSize: '0.9rem'}}>TF.js v{performanceInfo.tfjsVersion} | Backend: <strong>{performanceInfo.backend}</strong></p>
      <p style={{margin: 0, fontSize: '0.8rem'}}>GPU: {performanceInfo.gpuInfo}</p>
      <p style={{margin: 0, fontSize: '0.8rem'}}>{performanceInfo.browser} on {performanceInfo.os}</p>
    </div>
  );
}
