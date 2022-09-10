import React from 'react';
import { DAppProvider, ChainId } from "@usedapp/core"
import { Header } from "./components/Header"
import { Container } from "@material-ui/core"
import { Main } from "./components/Main"

function App() {
  return (
    <DAppProvider config={{
      supportedChains: [ChainId.Kovan, ChainId.Goerli, 1337],
      notifications: {
        expirationPeriod: 1000, // unit is ms, so this is 1 second
        checkInterval: 1000
      }
    }}>
      <Header />
      <Container maxWidth='md'>
        <Main />
      </Container>
    </DAppProvider>
  )
}

export default App;
