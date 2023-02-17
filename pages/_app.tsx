import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { SigningCosmWasmProvider } from "../contexts/cosmwasm";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SigningCosmWasmProvider>
      <Component {...pageProps} />
    </SigningCosmWasmProvider>
  )
}

export default MyApp
