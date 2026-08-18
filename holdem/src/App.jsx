import { useState } from 'react'
import GameSelect from './components/GameSelect'
import HoldemTable from './holdem/HoldemTable'
import SutdaTable from './sutda/SutdaTable'

/**
 * Two games share one table: the lobby picks which set of rules and cards to
 * play with, and each table can hand control back here.
 */
export default function App() {
  const [game, setGame] = useState(null)
  const toLobby = () => setGame(null)

  if (game === 'holdem') return <HoldemTable key="holdem" onExit={toLobby} />
  if (game === 'sutda') return <SutdaTable key="sutda" onExit={toLobby} />
  return <GameSelect onPick={setGame} />
}
