import styles from './header.module.scss';

export default function Header() {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.headerContent}>
          <a href="/">
            <img src="/logo.svg" alt="logo"/>
          </a>
      </div>
    </header>
  )
}
