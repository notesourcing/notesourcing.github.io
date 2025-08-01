import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      home: "Home",
      communities: "Communities",
      profile: "Profile",
      login: "Login",
      logout: "Logout",

      // Common actions
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      submit: "Submit",
      search: "Search",
      loading: "Loading...",

      // Authentication
      email: "Email",
      password: "Password",
      signIn: "Sign In",
      signUp: "Sign Up",
      signOut: "Sign Out",
      forgotPassword: "Forgot Password?",
      register: "Register",
      signInWithGoogle: "Sign in with Google",
      signInWithEmail: "Sign in with Email",
      registerWithEmail: "Register with Email",
      or: "OR",
      enterEmailPassword: "Enter email and password.",
      alreadyHaveAccount: "Already have an account? Sign In",
      dontHaveAccount: "Don't have an account? Register",

      // Communities
      communityName: "Community Name",
      communityDescription: "Community Description",
      joinCommunity: "Join Community",
      leaveCommunity: "Leave Community",
      createCommunity: "Create Community",
      manageCommunity: "Manage Community",
      communityMembers: "Community Members",
      cancel: "Cancel",
      confirm: "Confirm",
      visibility: "Visibility",
      publicCommunity: "🌍 Public - Everyone can see the notes",
      privateCommunity: "🔒 Private - Only members can see the notes",
      hiddenCommunity: "👁️‍🗨️ Hidden - Invitation only, not discoverable",
      publicHint: "Anyone can see the notes in this community.",
      privateHint:
        "Only members can see the notes, but the community is visible to everyone.",
      hiddenHint:
        "The community is completely hidden and only accessible by invitation.",
      noDescriptionAvailable: "No description available",
      lastActivity: "Last activity",
      active: "Active",
      loadingCommunities: "Loading communities...",
      globalStats: "Global Statistics",
      totalCommunities: "Total Communities",
      totalNotes: "Total Notes",
      totalComments: "Total Comments",
      totalReactions: "Total Reactions",
      yourCommunitiesAdmin: "Your Communities (Admin)",
      yourCommunitiesMember: "Your Communities (Member)",
      allCommunities: "All Communities",
      communityNamePlaceholder: "Name of your community",
      communityDescPlaceholder: "Describe your community",
      publicBadge: "Public",
      privateBadge: "Private",
      hiddenBadge: "Hidden",

      // Notes
      newNote: "New Note",
      noteTitle: "Note Title",
      noteContent: "Note Content",
      publishNote: "Publish Note",
      editNote: "Edit Note",
      deleteNote: "Delete Note",
      noNotes: "No notes available",

      // Comments
      addComment: "Add Comment",
      noComments: "No comments yet",
      comment: "Comment",

      // User roles
      userRoles: "User Roles",
      manageUsers: "Manage Users",
      role: "Role",
      user: "User",
      admin: "Admin",
      superAdmin: "Super Admin",

      // Join requests
      joinRequests: "Join Requests",
      approve: "Approve",
      reject: "Reject",
      loadingRequests: "Loading requests...",

      // Profile
      displayName: "Display Name",
      updateProfile: "Update Profile",
      accountSettings: "Account Settings",

      // Messages
      welcomeMessage: "Welcome to NoteSourcing",
      errorOccurred: "An error occurred",
      successMessage: "Operation completed successfully",

      // Language switcher
      language: "Language",
      selectLanguage: "Select Language",

      // Landing page
      landingTitle: "NoteSourcing",
      landingDescription:
        "A modern collaborative platform for collecting, organizing and sharing knowledge. Transform your ideas into a shared resource with the community and discover new perspectives through collaboration.",
      openSource: "Open Source",
      communityDriven: "Community-Driven",
      knowledgeSharing: "Knowledge Sharing",
      quickStart: "Quick Start",
      exploreUniverse: "Explore the Universe",
      exploreUniverseDesc: "Discover all public notes from the community",
      yourNotes: "Your Notes",
      yourNotesDesc: "Manage your personal and shared notes",
      signInAction: "Sign In",
      signInActionDesc: "Enter to start creating and sharing",
      communityAction: "Community",
      communityActionDesc: "Join thematic communities",

      // Landing page sections
      whatIsApp: "What is NoteSourcing?",
      whatIsAppDesc:
        "NoteSourcing is a modern and intuitive platform designed to help individuals and communities collect, organize and share knowledge collaboratively. Whether you're taking notes for study, research or work, NoteSourcing gives you the tools to transform your ideas into a shared resource.",

      mainFeatures: "Main Features",
      personalSharedNotes: "Personal and Shared Notes",
      personalSharedNotesDesc:
        "Create private notes for your personal use or share them with the community to enrich collective knowledge.",
      collaborativeCommunity: "Collaborative Community",
      collaborativeCommunityDesc:
        "Join various thematic communities and contribute with your specific knowledge.",
      realTimeReactions: "Real-time Reactions",
      realTimeReactionsDesc:
        "Interact with notes through immediate reactions and view real-time updates.",
      intelligentOrganization: "Intelligent Organization",
      intelligentOrganizationDesc:
        "Structure your notes with customizable fields for better organization and search.",
      accessControl: "Access Control",
      accessControlDesc:
        "Role and permission system to ensure content security and quality.",
      responsiveDesign: "Responsive Design",
      responsiveDesignDesc:
        "Access your notes from any device with an interface optimized for desktop and mobile.",

      howToStart: "How to Start",
      createAccount: "Create your Account",
      createAccountDesc: "Register for free to start using NoteSourcing",
      exploreCommunity: "Explore the Community",
      exploreCommunityDesc:
        "Discover notes shared by other users and find interesting content",
      createShare: "Create and Share",
      createShareDesc:
        "Start writing your notes and, if you want, share them with others",

      contribute: "Contribute",
      githubRepo: "GitHub Repository",
      githubRepoDesc: "Contribute to the project's open source code",
      improveApp: "Improve NoteSourcing",
      improveAppDesc: "Report bugs, propose new features or improvements",
      supportProject: "Support the Project",
      supportProjectDesc: "Contact us for donations or partnerships",

      welcomeFooter:
        "Welcome to the NoteSourcing community! Together we can create a shared knowledge network.",
    },
  },
  it: {
    translation: {
      // Navigation
      home: "Home",
      communities: "Comunità",
      profile: "Profilo",
      login: "Accedi",
      logout: "Esci",

      // Common actions
      save: "Salva",
      cancel: "Annulla",
      delete: "Elimina",
      edit: "Modifica",
      create: "Crea",
      submit: "Invia",
      search: "Cerca",
      loading: "Caricamento...",

      // Authentication
      email: "Email",
      password: "Password",
      signIn: "Accedi",
      signUp: "Registrati",
      signOut: "Esci",
      forgotPassword: "Password dimenticata?",
      register: "Registrati",
      signInWithGoogle: "Accedi con Google",
      signInWithEmail: "Accedi con l'Email",
      registerWithEmail: "Registrati con l'Email",
      or: "OPPURE",
      enterEmailPassword: "Inserisci email e password.",
      alreadyHaveAccount: "Hai già un account? Accedi",
      dontHaveAccount: "Non hai un account? Registrati",

      // Communities
      communityName: "Nome Comunità",
      communityDescription: "Descrizione Comunità",
      joinCommunity: "Unisciti alla Comunità",
      leaveCommunity: "Lascia la Comunità",
      createCommunity: "Crea Comunità",
      manageCommunity: "Gestisci Comunità",
      communityMembers: "Membri della Comunità",
      cancel: "Annulla",
      confirm: "Conferma",
      visibility: "Visibilità",
      publicCommunity: "🌍 Pubblica - Tutti possono vedere le note",
      privateCommunity: "🔒 Privata - Solo i membri possono vedere le note",
      hiddenCommunity: "👁️‍🗨️ Nascosta - Solo su invito, non scopribile",
      publicHint: "Chiunque può vedere le note di questa community.",
      privateHint:
        "Solo i membri possono vedere le note, ma la community è visibile a tutti.",
      hiddenHint:
        "La community è completamente nascosta e accessibile solo su invito.",
      noDescriptionAvailable: "Nessuna descrizione disponibile",
      lastActivity: "Ultima attività",
      active: "Attiva",
      loadingCommunities: "Caricamento delle community...",
      globalStats: "Statistiche Globali",
      totalCommunities: "Community Totali",
      totalNotes: "Note Totali",
      totalComments: "Commenti Totali",
      totalReactions: "Reazioni Totali",
      yourCommunitiesAdmin: "Le tue Community (Admin)",
      yourCommunitiesMember: "Le tue Community (Membro)",
      allCommunities: "Tutte le Community",
      communityNamePlaceholder: "Nome della tua community",
      communityDescPlaceholder: "Descrivi la tua community",
      publicBadge: "Pubblica",
      privateBadge: "Privata",
      hiddenBadge: "Nascosta",

      // Notes
      newNote: "Nuova Nota",
      noteTitle: "Titolo Nota",
      noteContent: "Contenuto Nota",
      publishNote: "Pubblica Nota",
      editNote: "Modifica Nota",
      deleteNote: "Elimina Nota",
      noNotes: "Nessuna nota disponibile",

      // Comments
      addComment: "Aggiungi Commento",
      noComments: "Nessun commento ancora",
      comment: "Commento",

      // User roles
      userRoles: "Ruoli Utenti",
      manageUsers: "Gestisci Utenti",
      role: "Ruolo",
      user: "Utente",
      admin: "Amministratore",
      superAdmin: "Super Amministratore",

      // Join requests
      joinRequests: "Richieste di Adesione",
      approve: "Approva",
      reject: "Rifiuta",
      loadingRequests: "Caricamento richieste...",

      // Profile
      displayName: "Nome Visualizzato",
      updateProfile: "Aggiorna Profilo",
      accountSettings: "Impostazioni Account",

      // Messages
      welcomeMessage: "Benvenuto in NoteSourcing",
      errorOccurred: "Si è verificato un errore",
      successMessage: "Operazione completata con successo",

      // Language switcher
      language: "Lingua",
      selectLanguage: "Seleziona Lingua",

      // Landing page
      landingTitle: "NoteSourcing",
      landingDescription:
        "Una piattaforma collaborativa moderna per raccogliere, organizzare e condividere conoscenze. Trasforma le tue idee in una risorsa condivisa con la community e scopri nuove prospettive attraverso la collaborazione.",
      openSource: "Open Source",
      communityDriven: "Community-Driven",
      knowledgeSharing: "Knowledge Sharing",
      quickStart: "Inizia Subito",
      exploreUniverse: "Esplora l'Universe",
      exploreUniverseDesc: "Scopri tutte le note pubbliche della community",
      yourNotes: "Le Tue Note",
      yourNotesDesc: "Gestisci le tue note personali e condivise",
      signInAction: "Accedi",
      signInActionDesc: "Entra per iniziare a creare e condividere",
      communityAction: "Community",
      communityActionDesc: "Unisciti alle comunità tematiche",

      // Landing page sections
      whatIsApp: "Cosa è NoteSourcing?",
      whatIsAppDesc:
        "NoteSourcing è una piattaforma moderna e intuitiva progettata per aiutare individui e comunità a raccogliere, organizzare e condividere conoscenze in modo collaborativo. Che tu stia prendendo appunti per studio, ricerca o lavoro, NoteSourcing ti offre gli strumenti per trasformare le tue idee in una risorsa condivisa.",

      mainFeatures: "Caratteristiche Principali",
      personalSharedNotes: "Note Personali e Condivise",
      personalSharedNotesDesc:
        "Crea note private per il tuo uso personale o condividile con la community per arricchire la conoscenza collettiva.",
      collaborativeCommunity: "Community Collaborative",
      collaborativeCommunityDesc:
        "Unisciti a diverse community tematiche e contribuisci con le tue conoscenze specifiche.",
      realTimeReactions: "Reazioni in Tempo Reale",
      realTimeReactionsDesc:
        "Interagisci con le note attraverso reazioni immediate e visualizza gli aggiornamenti in tempo reale.",
      intelligentOrganization: "Organizzazione Intelligente",
      intelligentOrganizationDesc:
        "Struttura le tue note con campi personalizzabili per una migliore organizzazione e ricerca.",
      accessControl: "Controllo Accessi",
      accessControlDesc:
        "Sistema di ruoli e permessi per garantire la sicurezza e la qualità dei contenuti.",
      responsiveDesign: "Design Responsivo",
      responsiveDesignDesc:
        "Accedi alle tue note da qualsiasi dispositivo con un'interfaccia ottimizzata per desktop e mobile.",

      howToStart: "Come Iniziare",
      createAccount: "Crea il tuo Account",
      createAccountDesc:
        "Registrati gratuitamente per iniziare a utilizzare NoteSourcing",
      exploreCommunity: "Esplora la Community",
      exploreCommunityDesc:
        "Scopri le note condivise da altri utenti e trova contenuti interessanti",
      createShare: "Crea e Condividi",
      createShareDesc:
        "Inizia a scrivere le tue note e, se vuoi, condividile con altri",

      contribute: "Contribuisci",
      githubRepo: "Repository GitHub",
      githubRepoDesc: "Contribuisci al codice open source del progetto",
      improveApp: "Migliora NoteSourcing",
      improveAppDesc: "Segnala bug, proponi nuove funzionalità o miglioramenti",
      supportProject: "Supporta il Progetto",
      supportProjectDesc: "Contattaci per donazioni o partnership",

      welcomeFooter:
        "Benvenuto nella community di NoteSourcing! Insieme possiamo creare una rete di conoscenza condivisa.",
    },
  },
  pt: {
    translation: {
      // Navigation
      home: "Início",
      communities: "Comunidades",
      profile: "Perfil",
      login: "Entrar",
      logout: "Sair",

      // Common actions
      save: "Salvar",
      cancel: "Cancelar",
      delete: "Excluir",
      edit: "Editar",
      create: "Criar",
      submit: "Enviar",
      search: "Buscar",
      loading: "Carregando...",

      // Authentication
      email: "Email",
      password: "Senha",
      signIn: "Entrar",
      signUp: "Cadastrar",
      signOut: "Sair",
      forgotPassword: "Esqueceu a senha?",
      register: "Cadastrar",
      signInWithGoogle: "Entrar com Google",
      signInWithEmail: "Entrar com Email",
      registerWithEmail: "Cadastrar com Email",
      or: "OU",
      enterEmailPassword: "Digite email e senha.",
      alreadyHaveAccount: "Já tem uma conta? Entrar",
      dontHaveAccount: "Não tem uma conta? Cadastrar",

      // Communities
      communityName: "Nome da Comunidade",
      communityDescription: "Descrição da Comunidade",
      joinCommunity: "Entrar na Comunidade",
      leaveCommunity: "Sair da Comunidade",
      createCommunity: "Criar Comunidade",
      manageCommunity: "Gerenciar Comunidade",
      communityMembers: "Membros da Comunidade",
      cancel: "Cancelar",
      confirm: "Confirmar",
      visibility: "Visibilidade",
      publicCommunity: "🌍 Pública - Todos podem ver as notas",
      privateCommunity: "🔒 Privada - Apenas membros podem ver as notas",
      hiddenCommunity: "👁️‍🗨️ Oculta - Apenas por convite, não descobrível",
      publicHint: "Qualquer pessoa pode ver as notas desta comunidade.",
      privateHint:
        "Apenas membros podem ver as notas, mas a comunidade é visível para todos.",
      hiddenHint:
        "A comunidade está completamente oculta e só é acessível por convite.",
      noDescriptionAvailable: "Nenhuma descrição disponível",
      lastActivity: "Última atividade",
      active: "Ativa",
      loadingCommunities: "Carregando comunidades...",
      globalStats: "Estatísticas Globais",
      totalCommunities: "Total de Comunidades",
      totalNotes: "Total de Notas",
      totalComments: "Total de Comentários",
      totalReactions: "Total de Reações",
      yourCommunitiesAdmin: "Suas Comunidades (Admin)",
      yourCommunitiesMember: "Suas Comunidades (Membro)",
      allCommunities: "Todas as Comunidades",
      communityNamePlaceholder: "Nome da sua comunidade",
      communityDescPlaceholder: "Descreva sua comunidade",
      publicBadge: "Pública",
      privateBadge: "Privada",
      hiddenBadge: "Oculta",

      // Notes
      newNote: "Nova Nota",
      noteTitle: "Título da Nota",
      noteContent: "Conteúdo da Nota",
      publishNote: "Publicar Nota",
      editNote: "Editar Nota",
      deleteNote: "Excluir Nota",
      noNotes: "Nenhuma nota disponível",

      // Comments
      addComment: "Adicionar Comentário",
      noComments: "Nenhum comentário ainda",
      comment: "Comentário",

      // User roles
      userRoles: "Funções de Usuário",
      manageUsers: "Gerenciar Usuários",
      role: "Função",
      user: "Usuário",
      admin: "Administrador",
      superAdmin: "Super Administrador",

      // Join requests
      joinRequests: "Solicitações de Entrada",
      approve: "Aprovar",
      reject: "Rejeitar",
      loadingRequests: "Carregando solicitações...",

      // Profile
      displayName: "Nome de Exibição",
      updateProfile: "Atualizar Perfil",
      accountSettings: "Configurações da Conta",

      // Messages
      welcomeMessage: "Bem-vindo ao NoteSourcing",
      errorOccurred: "Ocorreu um erro",
      successMessage: "Operação concluída com sucesso",

      // Language switcher
      language: "Idioma",
      selectLanguage: "Selecionar Idioma",

      // Landing page
      landingTitle: "NoteSourcing",
      landingDescription:
        "Uma plataforma colaborativa moderna para coletar, organizar e compartilhar conhecimento. Transforme suas ideias em um recurso compartilhado com a comunidade e descubra novas perspectivas através da colaboração.",
      openSource: "Código Aberto",
      communityDriven: "Orientado pela Comunidade",
      knowledgeSharing: "Compartilhamento de Conhecimento",
      quickStart: "Começar Agora",
      exploreUniverse: "Explorar o Universo",
      exploreUniverseDesc: "Descubra todas as notas públicas da comunidade",
      yourNotes: "Suas Notas",
      yourNotesDesc: "Gerencie suas notas pessoais e compartilhadas",
      signInAction: "Entrar",
      signInActionDesc: "Entre para começar a criar e compartilhar",
      communityAction: "Comunidade",
      communityActionDesc: "Junte-se às comunidades temáticas",

      // Landing page sections
      whatIsApp: "O que é o NoteSourcing?",
      whatIsAppDesc:
        "NoteSourcing é uma plataforma moderna e intuitiva projetada para ajudar indivíduos e comunidades a coletar, organizar e compartilhar conhecimento de forma colaborativa. Seja fazendo anotações para estudo, pesquisa ou trabalho, o NoteSourcing oferece as ferramentas para transformar suas ideias em um recurso compartilhado.",

      mainFeatures: "Características Principais",
      personalSharedNotes: "Notas Pessoais e Compartilhadas",
      personalSharedNotesDesc:
        "Crie notas privadas para seu uso pessoal ou compartilhe-as com a comunidade para enriquecer o conhecimento coletivo.",
      collaborativeCommunity: "Comunidade Colaborativa",
      collaborativeCommunityDesc:
        "Junte-se a diversas comunidades temáticas e contribua com seus conhecimentos específicos.",
      realTimeReactions: "Reações em Tempo Real",
      realTimeReactionsDesc:
        "Interaja com as notas através de reações imediatas e visualize atualizações em tempo real.",
      intelligentOrganization: "Organização Inteligente",
      intelligentOrganizationDesc:
        "Estruture suas notas com campos personalizáveis para melhor organização e busca.",
      accessControl: "Controle de Acesso",
      accessControlDesc:
        "Sistema de funções e permissões para garantir a segurança e qualidade do conteúdo.",
      responsiveDesign: "Design Responsivo",
      responsiveDesignDesc:
        "Acesse suas notas de qualquer dispositivo com uma interface otimizada para desktop e mobile.",

      howToStart: "Como Começar",
      createAccount: "Crie sua Conta",
      createAccountDesc:
        "Registre-se gratuitamente para começar a usar o NoteSourcing",
      exploreCommunity: "Explore a Comunidade",
      exploreCommunityDesc:
        "Descubra notas compartilhadas por outros usuários e encontre conteúdo interessante",
      createShare: "Criar e Compartilhar",
      createShareDesc:
        "Comece a escrever suas notas e, se quiser, compartilhe-as com outros",

      contribute: "Contribuir",
      githubRepo: "Repositório GitHub",
      githubRepoDesc: "Contribua para o código open source do projeto",
      improveApp: "Melhorar o NoteSourcing",
      improveAppDesc: "Relate bugs, proponha novos recursos ou melhorias",
      supportProject: "Apoiar o Projeto",
      supportProjectDesc: "Entre em contato conosco para doações ou parcerias",

      welcomeFooter:
        "Bem-vindo à comunidade NoteSourcing! Juntos podemos criar uma rede de conhecimento compartilhado.",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: "it", // default language (Italian as it seems to be the primary language)
    fallbackLng: "en",

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
