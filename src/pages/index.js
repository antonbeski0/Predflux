import dynamic from 'next/dynamic'
import Recorder from '../components/Recorder'
import Digitizer from '../components/Digitizer'
import ForecastModel from '../components/ForecastModel'
import React, { useState } from 'react'

const Visualizer3D = dynamic(() => import('../components/Visualizer3D'), { ssr: false })
const NeuralNetwork3D = dynamic(() => import('../components/NeuralNetwork3D'), { ssr: false })

export default function Home() {
  const [series, setSeries] = useState(null)
  const [pred, setPred] = useState(null)
  const [model, setModel] = useState(null);

  return (
    <div style={{ padding: 20, minHeight: '100vh', position: 'relative' }}>

      <div className="card" style={{ marginTop: 20 }}>
        <Recorder />
        <hr style={{ margin: '12px 0', borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        <h3>Digitizer</h3>
        <Digitizer onSeries={setSeries} />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Train & Forecast</h3>
        <ForecastModel series={series} onPredict={setPred} onModelTrained={setModel} />
        <hr style={{ margin: '12px 0', borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        <div style={{ height: 420 }}>
          <Visualizer3D series={series} pred={pred} />
        </div>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
          <h3>Neural Network</h3>
          <div style={{ height: "100%" }}>
              <NeuralNetwork3D model={model} />
          </div>
      </div>

      <p style={{ marginTop: 18, opacity: 0.7 }}>Notes:<br/>Runs fully in-browser. Screen recording begins only with user approval. CSV uploads supported for precise data input.</p>
      <p style={{ marginTop: 18, opacity: 0.7 }}>BUILT BY ANTON BESKI.M</p>
    </div>
  )
}
