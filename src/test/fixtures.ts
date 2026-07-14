export const healthFixture = {
  status: 'ok',
  service: 'doc-helper-ai-agent',
  version: '0.1.0',
}

export const documentsFixture = {
  documents: [{ source: 'pricing.md', chunks: 4 }],
  total_documents: 1,
  total_chunks: 4,
}

export const chatFixture = {
  message: 'The demonstration price is listed in the knowledge base.',
  classification: 'pricing_question',
  actions: [
    {
      tool: 'answer_with_rag',
      status: 'success',
      result: { sources: ['pricing.md'], num_chunks: 2 },
    },
  ],
  requires_human: false,
  sources: ['pricing.md'],
  trace_id: 'trace-demo-001',
  locale: 'en',
}

export const spanishChatFixture = {
  ...chatFixture,
  message: 'El precio de demostración figura en la base de conocimiento.',
  trace_id: 'trace-demo-es-001',
  locale: 'es',
}
