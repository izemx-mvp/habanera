import { PageHeader, Section, Card } from '@/components/ui'
import { BRAND, IZEMX } from '@/data/brand'

export default function About() {
  return (
    <>
      <PageHeader title="À propos du MVP" subtitle={`${BRAND.name} — démonstrateur ERP Bar & Cuisine, construit avec des données simulées.`} />
      <Section className="space-y-5 max-w-3xl">
        <Card title="Pourquoi ce MVP">
          <p className="text-[13px] text-ink-700 leading-relaxed">
            Ce démonstrateur permet à {BRAND.name} de tester concrètement la gestion des produits, des stocks, des bons de prélèvement, des
            commandes fournisseurs et des sorties hors-vente, avant la mise en place d'un ERP en production. Les quatre espaces (Administrateur,
            Économat, Bar, Cuisine) reproduisent les droits et les écrans prévus pour chaque rôle.
          </p>
        </Card>
        <Card title="Ce qui est simulé">
          <ul className="text-[13px] text-ink-700 space-y-2 list-disc pl-5">
            <li>Les comptes de connexion (un clic par rôle, sans mot de passe) : en production, l'authentification serait assurée par un fournisseur d'identité réel.</li>
            <li>Les données (stocks, mouvements, bons, commandes, fournisseurs) sont générées une fois, de façon déterministe, pour que la démonstration reste reproductible.</li>
            <li>Le catalogue du Bar reprend les catégories et références de la carte transmise ; les prix de vente non communiqués restent « Non renseigné ».</li>
          </ul>
        </Card>
        <Card title="Simplifications assumées">
          <ul className="text-[13px] text-ink-700 space-y-2 list-disc pl-5">
            <li>Le volume de bouteille et la dose servie sont des champs configurables sur chaque produit, mais le stock reste suivi à l'unité de stockage (bouteille), pas au millilitre près pour une bouteille entamée.</li>
            <li>{BRAND.aiName} répond par un moteur déterministe (règles + calculs sur les données), sans appel à un modèle de langage externe.</li>
          </ul>
        </Card>
        <Card title={IZEMX.name}>
          <p className="text-[13px] text-ink-700 leading-relaxed">{IZEMX.signature}. Adresse de démonstration : {IZEMX.mvpUrl}.</p>
        </Card>
      </Section>
    </>
  )
}
