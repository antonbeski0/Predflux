import '../styles/globals.css'
import Head from 'next/head'
import Header from '../components/Header'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>PREDFLUX</title>
        <link rel="icon" href="/logo.ico" />
      </Head>
      <Header />
      <Component {...pageProps} />
    </>
  )
}