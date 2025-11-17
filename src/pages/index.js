import dynamic from 'next/dynamic'
import Recorder from '../components/Recorder'
import Digitizer from '../components/Digitizer'
import ForecastModel from '../components/ForecastModel'
import React, { useState } from 'react'
import StockMarket from '../components/StockMarket'
import DevicePerformance from '../components/DevicePerformance'

const Visualizer3D = dynamic(() => import('../components/Visualizer3D'), { ssr: false })
const NeuralNetwork3D = dynamic(() => import('../components/NeuralNetwork3D'), { ssr: false })

export default function Home() {
  const [series, setSeries] = useState(null)
  const [pred, setPred] = useState(null)
  const [model, setModel] = useState(null);

  return (
    <div style={{ padding: 20, minHeight: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <DevicePerformance />
      </div>
      <h1 style={{ marginBottom: 10 }}>Neural Stock Visualizer — Demo</h1>
      <p style={{ opacity: 0.8 }}>Record your screen (or upload CSV), digitize price points, train a tiny LSTM in the browser, and view a 3D animation.</p>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>1) Screen Recorder / Upload</h3>
        <Recorder />
        <hr style={{ margin: '12px 0', borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        <h3>2) Digitizer</h3>
        <Digitizer onSeries={setSeries} />
        <hr style={{ margin: '12px 0', borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        <h3>Or Live Market Data</h3>
        <StockMarket onDataFetched={setSeries} />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>3) Train & Forecast</h3>
        <ForecastModel series={series} onPredict={setPred} onModelTrained={setModel} />
        <hr style={{ margin: '12px 0', borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        <h3>4) 3D Visual</h3>
        <div style={{ height: 420 }}>
          <Visualizer3D series={series} pred={pred} />
        </div>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
          <h3>5) Neural Network</h3>
          <div style={{ height: "100%" }}>
              <NeuralNetwork3D model={model} />
          </div>
      </div>

      <p style={{ marginTop: 18, opacity: 0.7 }}>Notes: App runs fully in browser. The recorder will ask permission and start only after you allow it. Use CSV uploads if you want exact numeric data.</p>
    </div>
  )
}
