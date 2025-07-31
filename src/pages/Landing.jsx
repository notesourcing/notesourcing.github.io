import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../App";
import styles from "./Landing.module.css";

export default function Landing() {
  const { user } = useContext(AuthContext);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>📚 NoteSourcing</h1>
        <p className={styles.description}>
          Una piattaforma collaborativa moderna per raccogliere, organizzare e
          condividere conoscenze. Trasforma le tue idee in una risorsa condivisa
          con la community e scopri nuove prospettive attraverso la
          collaborazione.
        </p>
        <div className={styles.tagline}>
          <span className={styles.tag}>🚀 Open Source</span>
          <span className={styles.tag}>🌍 Community-Driven</span>
          <span className={styles.tag}>💡 Knowledge Sharing</span>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>🚀 Inizia Subito</h2>
        <div className={styles.actionGrid}>
          <Link to="/" className={styles.actionCard}>
            <div className={styles.cardIcon}>🌌</div>
            <h3>Esplora l'Universe</h3>
            <p>Scopri tutte le note pubbliche della community</p>
          </Link>

          {user ? (
            <Link to="/dashboard" className={styles.actionCard}>
              <div className={styles.cardIcon}>📊</div>
              <h3>Il Tuo Dashboard</h3>
              <p>Gestisci le tue note personali e condivise</p>
            </Link>
          ) : (
            <Link to="/login" className={styles.actionCard}>
              <div className={styles.cardIcon}>🔑</div>
              <h3>Accedi</h3>
              <p>Entra per iniziare a creare e condividere</p>
            </Link>
          )}

          <Link to="/communities" className={styles.actionCard}>
            <div className={styles.cardIcon}>👥</div>
            <h3>Community</h3>
            <p>Unisciti alle comunità tematiche</p>
          </Link>
        </div>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🚀 Cosa è NoteSourcing?</h2>
          <p className={styles.text}>
            NoteSourcing è una piattaforma moderna e intuitiva progettata per
            aiutare individui e comunità a raccogliere, organizzare e
            condividere conoscenze in modo collaborativo. Che tu stia prendendo
            appunti per studio, ricerca o lavoro, NoteSourcing ti offre gli
            strumenti per trasformare le tue idee in una risorsa condivisa.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>✨ Caratteristiche Principali</h2>
          <div className={styles.features}>
            <div className={styles.feature}>
              <h3>📝 Note Personali e Condivise</h3>
              <p>
                Crea note private per il tuo uso personale o condividile con la
                community per arricchire la conoscenza collettiva.
              </p>
            </div>
            <div className={styles.feature}>
              <h3>👥 Community Collaborative</h3>
              <p>
                Unisciti a diverse community tematiche e contribuisci con le tue
                conoscenze specifiche.
              </p>
            </div>
            <div className={styles.feature}>
              <h3>⚡ Reazioni in Tempo Reale</h3>
              <p>
                Interagisci con le note attraverso reazioni immediate e
                visualizza gli aggiornamenti in tempo reale.
              </p>
            </div>
            <div className={styles.feature}>
              <h3>🔍 Organizzazione Intelligente</h3>
              <p>
                Struttura le tue note con campi personalizzabili per una
                migliore organizzazione e ricerca.
              </p>
            </div>
            <div className={styles.feature}>
              <h3>🛡️ Controllo Accessi</h3>
              <p>
                Sistema di ruoli e permessi per garantire la sicurezza e la
                qualità dei contenuti.
              </p>
            </div>
            <div className={styles.feature}>
              <h3>📱 Design Responsivo</h3>
              <p>
                Accedi alle tue note da qualsiasi dispositivo con un'interfaccia
                ottimizzata per desktop e mobile.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🎯 Come Iniziare</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3>Crea il tuo Account</h3>
                <p>
                  Registrati gratuitamente per iniziare a utilizzare
                  NoteSourcing
                </p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3>Esplora la Community</h3>
                <p>
                  Scopri le note condivise da altri utenti e trova contenuti
                  interessanti
                </p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3>Crea e Condividi</h3>
                <p>
                  Inizia a scrivere le tue note e, se vuoi, condividile con
                  altri
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className={styles.links}>
        <h2 className={styles.sectionTitle}>🤝 Contribuisci</h2>
        <div className={styles.linkGrid}>
          <a
            href="https://github.com/notesourcing/notesourcing.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkCard}
          >
            <div className={styles.linkIcon}>💻</div>
            <h3>Repository GitHub</h3>
            <p>Contribuisci al codice open source del progetto</p>
          </a>

          <a
            href="https://github.com/notesourcing/notesourcing.github.io/issues"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkCard}
          >
            <div className={styles.linkIcon}>🛠️</div>
            <h3>Migliora NoteSourcing</h3>
            <p>Segnala bug, proponi nuove funzionalità o miglioramenti</p>
          </a>

          <a href="mailto:support@notesourcing.org" className={styles.linkCard}>
            <div className={styles.linkIcon}>❤️</div>
            <h3>Supporta il Progetto</h3>
            <p>Contattaci per donazioni o partnership</p>
          </a>
        </div>
      </div>

      <div className={styles.footer}>
        <p>
          Benvenuto nella community di NoteSourcing! Insieme possiamo creare una
          rete di conoscenza condivisa.
        </p>
      </div>
    </div>
  );
}
