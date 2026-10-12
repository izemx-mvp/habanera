import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AgentSettings {
  language: 'fr' | 'ar' | 'en'
  hoursStart: string
  hoursEnd: string
  tone: 'formel' | 'chaleureux' | 'direct'
  autoReplyOutsideHours: boolean
  escalateOnLowConfidence: boolean
}

export interface WhatsAppAttachment {
  name: string
  size?: string
  type: 'excel' | 'ticket_z' | 'pdf' | 'image' | 'other'
  url?: string
}

export interface WhatsAppMessage {
  id: string
  from: 'admin' | 'agent' | 'client'
  text: string
  at: string
  attachment?: WhatsAppAttachment
  actionTaken?: string
}

export interface WhatsAppConversation {
  id: string
  contactName: string
  subtitle?: string
  phone: string
  isAgentAssistant?: boolean
  messages: WhatsAppMessage[]
}

export interface KnowledgeDoc {
  id: string
  name: string
  kind: 'modele' | 'faq' | 'consigne'
  uploadedAt: string
  uploadedBy: string
}

export const SEED_AGENT_CONVERSATION: WhatsAppConversation = {
  id: 'wa-agent',
  contactName: 'Agent IA — Habanera Assistant',
  subtitle: 'Assistant Stock, Z de caisse & Catalogues',
  phone: 'Habanera IA Direct Copilot',
  isAgentAssistant: true,
  messages: [
    {
      id: 'm-seed-0',
      from: 'agent',
      text: "Bonjour Samir ! Je suis votre assistant opérationnel Habanera IA.\n\nVous pouvez m'envoyer directement ici :\n• Vos tickets Z de caisse (PDF, photo ou scan)\n• Vos fichiers Excel de produits (.xlsx)\n• Vos bons de livraison & factures\n\nJe configure automatiquement les stocks, décompte les ventes et importe vos catalogues en temps réel.",
      at: '2026-10-09T08:30:00',
    },
    {
      id: 'm-seed-1',
      from: 'admin',
      text: "Bonjour Habanera IA, voici le ticket Z de clôture de caisse du Bar pour le service du vendredi soir.",
      at: '2026-10-09T08:35:00',
      attachment: {
        name: 'Ticket_Z_Caisse_Bar_09_10.pdf',
        size: '184 Ko',
        type: 'ticket_z',
      },
    },
    {
      id: 'm-seed-2',
      from: 'agent',
      text: "📥 Ticket Z du 09/10 bien reçu et analysé avec succès !\n\n• Chiffre d'affaires Bar : 16 850 MAD\n• Ventes constatées : 36 Cocktails Signature, 24 Bières Casablanca, 12 Verres Jameson, 8 Red Bull\n\n✅ Stocks du Bar décomptés automatiquement.\n📊 Écritures de sorties pour ventes enregistrées dans l'ERP.\n⚠️ Alerte stock faible : Tanqueray est à 1 bouteille (seuil : 2).",
      at: '2026-10-09T08:35:15',
      actionTaken: 'Stocks du Bar synchronisés avec le ticket Z',
    },
    {
      id: 'm-seed-3',
      from: 'admin',
      text: "Merci ! Peux-tu me rappeler le stock actuel de Jameson au bar et à l'économat ?",
      at: '2026-10-09T09:00:00',
    },
    {
      id: 'm-seed-4',
      from: 'agent',
      text: "Voici les niveaux actuels pour Jameson :\n• Stock Bar : 4 bouteilles (seuil minimum : 2, cible : 6)\n• Stock Économat : 18 bouteilles\n\nNiveau sécurisé, aucun réassort urgent requis pour cette référence.",
      at: '2026-10-09T09:00:20',
    },
  ],
}

const SEED_CONVERSATIONS: WhatsAppConversation[] = [
  SEED_AGENT_CONVERSATION,
]

const SEED_DOCS: KnowledgeDoc[] = [
  { id: 'kb-1', name: 'Modèle — Bon de prélèvement HABANERA.pdf', kind: 'modele', uploadedAt: '2026-09-01', uploadedBy: 'Samir Idrissi' },
  { id: 'kb-2', name: 'FAQ clients — réservations et événements.docx', kind: 'faq', uploadedAt: '2026-09-02', uploadedBy: 'Samir Idrissi' },
  { id: 'kb-3', name: 'Consignes de ton — réponses WhatsApp.docx', kind: 'consigne', uploadedAt: '2026-09-02', uploadedBy: 'Samir Idrissi' },
]

interface AgentIaState {
  settings: AgentSettings
  updateSettings: (patch: Partial<AgentSettings>) => void

  conversations: WhatsAppConversation[]
  sendMessage: (
    conversationId: string,
    text: string,
    attachment?: WhatsAppAttachment,
    from?: 'admin' | 'agent' | 'client',
    actionTaken?: string,
  ) => void

  knowledgeDocs: KnowledgeDoc[]
  addDoc: (doc: Omit<KnowledgeDoc, 'id'>) => void
  removeDoc: (id: string) => void
  resetConversations: () => void
}

export const useAgentIaStore = create<AgentIaState>()(
  persist(
    (set) => ({
      settings: {
        language: 'fr',
        hoursStart: '09:00',
        hoursEnd: '23:00',
        tone: 'chaleureux',
        autoReplyOutsideHours: true,
        escalateOnLowConfidence: true,
      },
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      conversations: SEED_CONVERSATIONS,
      sendMessage: (conversationId, text, attachment, from = 'admin', actionTaken) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    {
                      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                      from,
                      text,
                      at: new Date().toISOString(),
                      attachment,
                      actionTaken,
                    },
                  ],
                }
              : c,
          ),
        })),

      resetConversations: () => set({ conversations: SEED_CONVERSATIONS }),

      knowledgeDocs: SEED_DOCS,
      addDoc: (doc) => set((s) => ({ knowledgeDocs: [{ ...doc, id: `kb-${Date.now()}` }, ...s.knowledgeDocs] })),
      removeDoc: (id) => set((s) => ({ knowledgeDocs: s.knowledgeDocs.filter((d) => d.id !== id) })),
    }),
    {
      name: 'habanera-agent-ia',
      version: 5,
      migrate: (persistedState: any) => {
        const agentConvo = persistedState?.conversations?.find((c: any) => c.id === 'wa-agent') || SEED_AGENT_CONVERSATION
        return {
          ...persistedState,
          conversations: [agentConvo],
        }
      },
    },
  ),
)
