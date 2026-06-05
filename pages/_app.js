import '../styles/globals.css'
import Head from 'next/head'
import { SessionProvider } from 'next-auth/react'

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Head>
        <title>Marathon Skills 2026</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true"/>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
      </Head>
      <Component {...pageProps} />
    </SessionProvider>
  )
}
