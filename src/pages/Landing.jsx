import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../App";
import { getAppName } from "../utils/appName";
import styles from "./Landing.module.css";

export default function Landing() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const appName = getAppName();

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>📚 {t("landingTitle")}</h1>
        <p className={styles.description}>{t("landingDescription")}</p>
        <div className={styles.tagline}>
          <span className={styles.tag}>🚀 {t("openSource")}</span>
          <span className={styles.tag}>🌍 {t("communityDriven")}</span>
          <span className={styles.tag}>💡 {t("knowledgeSharing")}</span>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>🚀 {t("quickStart")}</h2>
        <div className={styles.actionGrid}>
          <Link to="/" className={styles.actionCard}>
            <div className={styles.cardIcon}>🌌</div>
            <h3>{t("exploreUniverse")}</h3>
            <p>{t("exploreUniverseDesc")}</p>
          </Link>

          {user ? (
            <Link to="/" className={styles.actionCard}>
              <div className={styles.cardIcon}>�</div>
              <h3>{t("yourNotes")}</h3>
              <p>{t("yourNotesDesc")}</p>
            </Link>
          ) : (
            <Link to="/login" className={styles.actionCard}>
              <div className={styles.cardIcon}>🔑</div>
              <h3>{t("signInAction")}</h3>
              <p>{t("signInActionDesc")}</p>
            </Link>
          )}

          <Link to="/communities" className={styles.actionCard}>
            <div className={styles.cardIcon}>👥</div>
            <h3>{t("communityAction")}</h3>
            <p>{t("communityActionDesc")}</p>
          </Link>
        </div>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🚀 {t("whatIsApp")}</h2>
          <p className={styles.text}>{t("whatIsAppDesc")}</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>✨ {t("mainFeatures")}</h2>
          <div className={styles.features}>
            <div className={styles.feature}>
              <h3>📝 {t("personalSharedNotes")}</h3>
              <p>{t("personalSharedNotesDesc")}</p>
            </div>
            <div className={styles.feature}>
              <h3>👥 {t("collaborativeCommunity")}</h3>
              <p>{t("collaborativeCommunityDesc")}</p>
            </div>
            <div className={styles.feature}>
              <h3>⚡ {t("realTimeReactions")}</h3>
              <p>{t("realTimeReactionsDesc")}</p>
            </div>
            <div className={styles.feature}>
              <h3>🔍 {t("intelligentOrganization")}</h3>
              <p>{t("intelligentOrganizationDesc")}</p>
            </div>
            <div className={styles.feature}>
              <h3>🛡️ {t("accessControl")}</h3>
              <p>{t("accessControlDesc")}</p>
            </div>
            <div className={styles.feature}>
              <h3>📱 {t("responsiveDesign")}</h3>
              <p>{t("responsiveDesignDesc")}</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🎯 {t("howToStart")}</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3>{t("createAccount")}</h3>
                <p>{t("createAccountDesc")}</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3>{t("exploreCommunity")}</h3>
                <p>{t("exploreCommunityDesc")}</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3>{t("createShare")}</h3>
                <p>{t("createShareDesc")}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className={styles.links}>
        <h2 className={styles.sectionTitle}>🤝 {t("contribute")}</h2>
        <div className={styles.linkGrid}>
          <a
            href="https://github.com/notesourcing/notesourcing.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkCard}
          >
            <div className={styles.linkIcon}>💻</div>
            <h3>{t("githubRepo")}</h3>
            <p>{t("githubRepoDesc")}</p>
          </a>

          <a
            href="https://github.com/notesourcing/notesourcing.github.io/issues"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkCard}
          >
            <div className={styles.linkIcon}>🛠️</div>
            <h3>{t("improveApp")}</h3>
            <p>{t("improveAppDesc")}</p>
          </a>

          <a href="mailto:support@notesourcing.org" className={styles.linkCard}>
            <div className={styles.linkIcon}>❤️</div>
            <h3>{t("supportProject")}</h3>
            <p>{t("supportProjectDesc")}</p>
          </a>
        </div>
      </div>

      <div className={styles.footer}>
        <p>{t("welcomeFooter")}</p>
      </div>
    </div>
  );
}
