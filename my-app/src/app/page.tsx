"use client"
import Player from './Components/Player'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <Player/>
    </main>
  )
}
