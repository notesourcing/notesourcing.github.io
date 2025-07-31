import React from "react";
import { Link } from "react-router-dom";
import styles from "./About.module.css";

export default function About() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Benvenuto in NoteSourcing</h1>
        <p className={styles.subtitle}>
          La piattaforma collaborativa per condividere e organizzare le tue note
        </p>
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
                <h3>Contribuisci</h3>
                <p>Crea le tue prime note e condividile con la community</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h3>Collabora</h3>
                <p>
                  Interagisci con altri utenti attraverso reazioni e feedback
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🌟 La Nostra Missione</h2>
          <p className={styles.text}>
            Crediamo che la conoscenza sia più potente quando viene condivisa.
            NoteSourcing nasce dalla visione di creare uno spazio digitale dove
            le persone possano facilmente raccogliere, organizzare e condividere
            le proprie conoscenze, creando una rete collaborativa di
            apprendimento che beneficia tutti i partecipanti.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🔧 Tecnologie</h2>
          <p className={styles.text}>
            NoteSourcing è costruito utilizzando tecnologie moderne e
            affidabili:
          </p>
          <div className={styles.technologies}>
            <span className={styles.tech}>React</span>
            <span className={styles.tech}>Firebase</span>
            <span className={styles.tech}>Vite</span>
            <span className={styles.tech}>CSS Modules</span>
            <span className={styles.tech}>Progressive Web App</span>
          </div>
        </section>

        <div className={styles.cta}>
          <h2>Pronto a iniziare?</h2>
          <p>
            Unisciti alla community di NoteSourcing e inizia a condividere le
            tue conoscenze oggi stesso!
          </p>
          <div className={styles.ctaButtons}>
            <Link to="/login" className={styles.primaryButton}>
              🚀 Inizia Ora
            </Link>
            <Link to="/" className={styles.secondaryButton}>
              🏠 Esplora le Note
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
