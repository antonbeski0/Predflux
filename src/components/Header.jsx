import DevicePerformance from './DevicePerformance';

export default function Header() {
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', backgroundColor: '#111', borderBottom: '1px solid #333' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/logo.png" alt="PREDFLUX Logo" style={{ height: '40px', marginRight: '15px' }} />
        <h1 style={{ fontSize: '1.5rem', color: 'white', margin: 0 }}>PREDFLUX</h1>
      </div>
      <DevicePerformance />
    </header>
  );
}