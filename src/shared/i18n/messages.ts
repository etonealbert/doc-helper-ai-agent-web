export const supportedLocales = ['es', 'en'] as const
export type Locale = (typeof supportedLocales)[number]

export const defaultLocale: Locale = 'es'

interface StarterPromptTranslation {
  label: string
  type: string
  safety?: boolean
}

export interface Messages {
  metadata: {
    title: string
    description: string
  }
  language: {
    groupLabel: string
    spanish: string
    english: string
    switchToSpanish: string
    switchToEnglish: string
  }
  app: {
    homeLabel: string
    workflowDemo: string
    portfolioDemo: string
    openRepository: string
    repositoryTitle: string
    source: string
    disclaimerLabel: string
    disclaimerLead: string
    disclaimerBody: string
    footer: string
  }
  health: {
    checking: string
    online: string
    degraded: string
    unavailable: string
    checkAgain: string
  }
  chat: {
    title: string
    subtitle: string
    clear: string
    clearLabel: string
    contextLabel: string
    tryRoute: string
    starterPromptsTitle: string
    starterPrompts: readonly StarterPromptTranslation[]
    privacy: string
    ephemeralSession: string
    sessionCopy: string
    session: string
    welcome: string
    composerLabel: string
    composerPlaceholder: string
    composerHint: string
    remainingCharacters: (count: number) => string
    working: string
    send: string
    preparingResponse: string
    userMessageLabel: string
    assistantMessageLabel: string
    you: string
    agentActions: string
    classifications: Record<string, string>
    urgentTitle: string
    reviewTitle: string
    urgentBody: string
    reviewBody: string
    answerSources: string
    sources: string
    tools: Record<string, string>
    toolStatuses: Record<string, string>
    safeResultPreview: string
    noResultDetails: string
    trace: string
    traceCopied: string
    copyTrace: string
    traceCopiedAnnouncement: string
    requestNotCompleted: string
    retry: string
  }
  documents: {
    grounding: string
    knowledgeBase: string
    loading: string
    unavailable: string
    retry: string
    documentCountLabel: (count: number) => string
    chunkCountLabel: (count: number) => string
  }
  errors: {
    validation: string
    rateLimit: string
    crmUnavailable: string
    serviceUnavailable: string
    server: string
    network: string
    timeout: string
    invalidResponse: string
  }
}

export const messages = {
  es: {
    metadata: {
      title: 'Doc Helper AI Agent | Demostración del flujo',
      description:
        'Demostración de portafolio de un flujo de agente de IA basado en documentos.',
    },
    language: {
      groupLabel: 'Idioma de la interfaz',
      spanish: 'Español',
      english: 'English',
      switchToSpanish: 'Cambiar la interfaz a español',
      switchToEnglish: 'Cambiar la interfaz a inglés',
    },
    app: {
      homeLabel: 'Inicio de Doc Helper AI Agent',
      workflowDemo: 'Demostración del flujo',
      portfolioDemo: 'Demo de portafolio',
      openRepository: 'Abrir el repositorio del proyecto',
      repositoryTitle: 'Repositorio del proyecto',
      source: 'Código',
      disclaimerLabel: 'Aviso de la demostración',
      disclaimerLead: 'Entorno de demostración.',
      disclaimerBody:
        'No proporciona diagnósticos ni tratamientos. No introduzcas datos reales de pacientes. En situaciones urgentes o potencialmente mortales, contacta con los servicios de emergencia locales o con un profesional cualificado.',
      footer:
        'Doc Helper AI Agent es una demostración de ingeniería para portafolio, no un servicio médico.',
    },
    health: {
      checking: 'Comprobando API',
      online: 'API disponible',
      degraded: 'API degradada',
      unavailable: 'API no disponible',
      checkAgain: 'Volver a comprobar',
    },
    chat: {
      title: 'Espacio de trabajo del agente',
      subtitle: 'Conversación basada en documentos y trazabilidad del flujo',
      clear: 'Borrar',
      clearLabel: 'Borrar conversación',
      contextLabel: 'Contexto de la demostración',
      tryRoute: 'Prueba una ruta',
      starterPromptsTitle: 'Mensajes de ejemplo',
      starterPrompts: [
        { label: '¿Cuál es su horario de atención?', type: 'General' },
        {
          label: '¿Cuánto cuesta el blanqueamiento dental?',
          type: 'Precios',
        },
        {
          label:
            'Quiero reservar una cita de blanqueamiento el próximo viernes.',
          type: 'Cita',
        },
        {
          label: '¿Cuál es su política de cancelación?',
          type: 'Política',
        },
        {
          label: 'Tengo dolor intenso e hinchazón. ¿Qué debo hacer?',
          type: 'Demo de seguridad',
          safety: true,
        },
      ],
      privacy: 'Privacidad',
      ephemeralSession: 'Sesión efímera',
      sessionCopy:
        'Los mensajes permanecen en esta pestaña y la interfaz no los guarda. Solo se almacena localmente un identificador de sesión seudónimo.',
      session: 'Sesión',
      welcome:
        'Hola. Puedo responder preguntas de la base de conocimiento de demostración, explicar precios y políticas, o mostrar cómo se enrutan los flujos de citas y revisión humana.',
      composerLabel: 'Enviar un mensaje a Doc Helper AI Agent',
      composerPlaceholder:
        'Pregunta sobre servicios, precios, políticas o programación...',
      composerHint:
        'Solo demostración. No introduzcas datos personales ni de pacientes.',
      remainingCharacters: (count: number) =>
        count === 1 ? 'Queda 1 carácter' : `Quedan ${count} caracteres`,
      working: 'Procesando',
      send: 'Enviar',
      preparingResponse: 'El asistente está preparando una respuesta.',
      userMessageLabel: 'Mensaje del usuario',
      assistantMessageLabel: 'Mensaje del asistente',
      you: 'Tú',
      agentActions: 'Acciones del agente',
      classifications: {
        appointment_request: 'Solicitud de cita',
        pricing_question: 'Pregunta sobre precios',
        document_question: 'Pregunta sobre documentos',
        emergency_or_pain: 'Urgencia o dolor',
        complaint: 'Queja',
        general_question: 'Pregunta general',
        human_escalation: 'Revisión humana',
      },
      urgentTitle: 'Puede ser necesaria ayuda profesional',
      reviewTitle: 'Se recomienda revisión humana',
      urgentBody:
        'Este asistente no puede proporcionar consejo médico y no ha contactado a los servicios de emergencia. En situaciones urgentes o potencialmente mortales, contacta ahora con los servicios de emergencia locales o con un profesional cualificado.',
      reviewBody:
        'Este asistente no puede proporcionar consejo médico. Una llamada o un ticket solo se confirma cuando una acción completada correctamente que aparece a continuación lo indica de forma explícita.',
      answerSources: 'Fuentes de la respuesta',
      sources: 'Fuentes',
      tools: {
        answer_with_rag: 'Respuesta con documentos',
        check_availability: 'Comprobar disponibilidad',
        create_appointment_request: 'Crear solicitud de cita',
        create_callback_request: 'Crear solicitud de llamada',
        create_complaint_ticket: 'Crear ticket de queja',
        escalate_to_human: 'Solicitar revisión humana',
      },
      toolStatuses: {
        success: 'Correcto',
        error: 'Error',
        skipped: 'Omitido',
      },
      safeResultPreview: 'Vista previa segura del resultado',
      noResultDetails: 'Sin detalles del resultado',
      trace: 'Traza',
      traceCopied: 'ID de traza copiado',
      copyTrace: 'Copiar ID de traza',
      traceCopiedAnnouncement: 'ID de traza copiado al portapapeles.',
      requestNotCompleted: 'Solicitud no completada',
      retry: 'Reintentar',
    },
    documents: {
      grounding: 'Contexto documental',
      knowledgeBase: 'Base de conocimiento',
      loading: 'Cargando documentos',
      unavailable: 'Los metadatos de los documentos no están disponibles.',
      retry: 'Reintentar',
      documentCountLabel: (count: number) =>
        count === 1 ? 'documento' : 'documentos',
      chunkCountLabel: (count: number) =>
        count === 1 ? 'fragmento consultable' : 'fragmentos consultables',
    },
    errors: {
      validation:
        'No se pudo procesar la solicitud. Revisa tu mensaje e inténtalo de nuevo.',
      rateLimit:
        'El asistente está recibiendo muchas solicitudes. Espera un momento y vuelve a intentarlo.',
      crmUnavailable:
        'El servicio de programación no está disponible temporalmente. No se creó ninguna cita ni solicitud de llamada.',
      serviceUnavailable:
        'Un servicio auxiliar no está disponible temporalmente. Inténtalo de nuevo en breve.',
      server:
        'El asistente encontró un error del servidor. Inténtalo de nuevo.',
      network:
        'No pudimos conectar con el asistente. Comprueba tu conexión e inténtalo de nuevo.',
      timeout:
        'La solicitud tardó demasiado. No se ha confirmado ninguna acción; vuelve a intentarlo.',
      invalidResponse:
        'El asistente devolvió una respuesta inesperada. Inténtalo de nuevo.',
    },
  },
  en: {
    metadata: {
      title: 'Doc Helper AI Agent | Workflow Demo',
      description:
        'Portfolio demonstration of a document-grounded AI agent workflow.',
    },
    language: {
      groupLabel: 'Interface language',
      spanish: 'Español',
      english: 'English',
      switchToSpanish: 'Switch the interface to Spanish',
      switchToEnglish: 'Switch the interface to English',
    },
    app: {
      homeLabel: 'Doc Helper AI Agent home',
      workflowDemo: 'Workflow demonstration',
      portfolioDemo: 'Portfolio demo',
      openRepository: 'Open project repository',
      repositoryTitle: 'Project repository',
      source: 'Source',
      disclaimerLabel: 'Demonstration disclaimer',
      disclaimerLead: 'Demonstration environment.',
      disclaimerBody:
        'No diagnosis or treatment is provided. Do not enter real patient data. For urgent or life-threatening situations, contact local emergency services or a qualified professional.',
      footer:
        'Doc Helper AI Agent is an engineering portfolio demonstration, not a medical service.',
    },
    health: {
      checking: 'Checking API',
      online: 'API online',
      degraded: 'API degraded',
      unavailable: 'API unavailable',
      checkAgain: 'Check again',
    },
    chat: {
      title: 'Agent workspace',
      subtitle: 'Document-grounded conversation and workflow trace',
      clear: 'Clear',
      clearLabel: 'Clear conversation',
      contextLabel: 'Demonstration context',
      tryRoute: 'Try a route',
      starterPromptsTitle: 'Starter prompts',
      starterPrompts: [
        { label: 'What are your opening hours?', type: 'General' },
        {
          label: 'How much does teeth whitening cost?',
          type: 'Pricing',
        },
        {
          label: 'I want to book a whitening appointment next Friday.',
          type: 'Appointment',
        },
        { label: 'What is your cancellation policy?', type: 'Policy' },
        {
          label: 'I have severe pain and swelling. What should I do?',
          type: 'Safety demo',
          safety: true,
        },
      ],
      privacy: 'Privacy',
      ephemeralSession: 'Ephemeral session',
      sessionCopy:
        'Messages stay in this tab and are not saved by the interface. Only a pseudonymous session identifier is stored locally.',
      session: 'Session',
      welcome:
        'Hello. I can answer questions from the demonstration knowledge base, explain pricing and policies, or show how appointment and escalation workflows are routed.',
      composerLabel: 'Message the Doc Helper AI Agent',
      composerPlaceholder:
        'Ask about services, pricing, policies, or scheduling...',
      composerHint: 'Demo only. Do not enter personal or patient data.',
      remainingCharacters: (count: number) =>
        count === 1 ? '1 character remaining' : `${count} characters remaining`,
      working: 'Working',
      send: 'Send',
      preparingResponse: 'The assistant is preparing a response.',
      userMessageLabel: 'You message',
      assistantMessageLabel: 'Assistant message',
      you: 'You',
      agentActions: 'Agent actions',
      classifications: {
        appointment_request: 'Appointment Request',
        pricing_question: 'Pricing Question',
        document_question: 'Document Question',
        emergency_or_pain: 'Emergency Or Pain',
        complaint: 'Complaint',
        general_question: 'General Question',
        human_escalation: 'Human Escalation',
      },
      urgentTitle: 'Professional help may be needed',
      reviewTitle: 'Human review recommended',
      urgentBody:
        'This assistant cannot provide medical advice and has not contacted emergency services. For urgent or life-threatening situations, contact local emergency services or a qualified professional now.',
      reviewBody:
        'This assistant cannot provide medical advice. A callback or ticket is only confirmed when a successful action below explicitly says so.',
      answerSources: 'Answer sources',
      sources: 'Sources',
      tools: {
        answer_with_rag: 'Answer With Rag',
        check_availability: 'Check Availability',
        create_appointment_request: 'Create Appointment Request',
        create_callback_request: 'Create Callback Request',
        create_complaint_ticket: 'Create Complaint Ticket',
        escalate_to_human: 'Escalate To Human',
      },
      toolStatuses: {
        success: 'Success',
        error: 'Error',
        skipped: 'Skipped',
      },
      safeResultPreview: 'Safe result preview',
      noResultDetails: 'No result details',
      trace: 'Trace',
      traceCopied: 'Trace ID copied',
      copyTrace: 'Copy trace ID',
      traceCopiedAnnouncement: 'Trace ID copied to clipboard.',
      requestNotCompleted: 'Request not completed',
      retry: 'Retry',
    },
    documents: {
      grounding: 'Grounding',
      knowledgeBase: 'Knowledge base',
      loading: 'Loading documents',
      unavailable: 'Document metadata is unavailable.',
      retry: 'Retry',
      documentCountLabel: (count: number) =>
        count === 1 ? 'document' : 'documents',
      chunkCountLabel: (count: number) =>
        count === 1 ? 'searchable chunk' : 'searchable chunks',
    },
    errors: {
      validation:
        'The request could not be processed. Review your message and try again.',
      rateLimit:
        'The assistant is receiving many requests. Please wait a moment and retry.',
      crmUnavailable:
        'The scheduling service is temporarily unavailable. No appointment or callback was created.',
      serviceUnavailable:
        'A supporting service is temporarily unavailable. Please try again shortly.',
      server: 'The assistant encountered a server error. Please try again.',
      network:
        'We could not reach the assistant. Check your connection and try again.',
      timeout:
        'The request took too long. No action has been confirmed; please retry.',
      invalidResponse:
        'The assistant returned an unexpected response. Please try again.',
    },
  },
} satisfies Record<Locale, Messages>
