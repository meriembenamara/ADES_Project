export const initialClassrooms = [
  {
    id: "cls-archive",
    name: "Classe Archive Administrative",
    code: "CAA-01",
    description: "Documents de gestion interne, correspondances et formulaires normalises.",
    categories: [
      {
        id: "cat-factures",
        name: "Factures Fournisseurs",
        children: ["Factures locales", "Factures import"],
        documents: 18,
        reviewerNotes: 6,
        historyCount: 12,
        lastUpload: "2026-03-29",
        status: "Stable",
        documentTitle: "Facture Fournisseur Mars 2026",
        documentSnippets: [
          "Numero facture : FAC-2026-0315",
          "Date emission : 15/03/2026",
          "Fournisseur : Media Bureau SARL",
          "Montant TTC : 4 850,000 TND",
          "Reference client : ADES-ACH-42",
        ],
        attributeOptions: ["Numero facture", "Date emission", "Fournisseur", "Montant TTC", "Reference client"],
        labeledFields: [
          { id: "lab-1", attribute: "Numero facture", value: "FAC-2026-0315" },
          { id: "lab-2", attribute: "Montant TTC", value: "4 850,000 TND" },
        ],
      },
      {
        id: "cat-bons",
        name: "Bons de Livraison",
        children: ["Livraisons depot", "Livraisons agence"],
        documents: 9,
        reviewerNotes: 2,
        historyCount: 5,
        lastUpload: "2026-03-24",
        status: "A verifier",
        documentTitle: "Bon de Livraison Depot Central",
        documentSnippets: [
          "Bon livraison : BL-8892",
          "Date reception : 24/03/2026",
          "Transporteur : Rapid Move",
          "Quantite totale : 120 cartons",
        ],
        attributeOptions: ["Bon livraison", "Date reception", "Transporteur", "Quantite totale"],
        labeledFields: [],
      },
    ],
  },
  {
    id: "cls-rh",
    name: "Classe Ressources Humaines",
    code: "CRH-08",
    description: "Dossiers lies au personnel, contrats et suivi des absences.",
    categories: [
      {
        id: "cat-contrats",
        name: "Contrats de Travail",
        children: ["CDI", "CDD"],
        documents: 23,
        reviewerNotes: 4,
        historyCount: 16,
        lastUpload: "2026-03-21",
        status: "En cours",
        documentTitle: "Contrat CDI Responsable Qualite",
        documentSnippets: [
          "Employe : Salma Ben Youssef",
          "Type contrat : CDI",
          "Date debut : 01/04/2026",
          "Salaire brut : 2 400,000 TND",
          "Poste : Responsable Qualite",
        ],
        attributeOptions: ["Employe", "Type contrat", "Date debut", "Salaire brut", "Poste"],
        labeledFields: [{ id: "lab-3", attribute: "Type contrat", value: "CDI" }],
      },
    ],
  },
];

export const primaryNavItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Gestion des users" },
  { id: "documents", label: "Gestion des documents" },
  { id: "classes", label: "Gestion des classes" },
  { id: "control-points", label: "Points de controle" },
];

export const initialUsers = [
  {
    id: "usr-1",
    fullName: "Meriem Ben Amara",
    email: "meriembenamara001@gmail.com",
  },
  {
    id: "usr-2",
    fullName: "Salma Ben Youssef",
    email: "salma.benyoussef@ades.tn",
  },
  {
    id: "usr-3",
    fullName: "Yassine Trabelsi",
    email: "yassine.trabelsi@ades.tn",
  },
  {
    id: "usr-4",
    fullName: "Amine Gharbi",
    email: "amine.gharbi@ades.tn",
  },
];

export const controlPointOptions = [
  {
    className: "Classe A",
    categories: [
      {
        name: "Categorie 1",
        attributes: ["Montant Total", "Date", "Nom Client"],
      },
      {
        name: "Categorie 2",
        attributes: ["Reference", "Montant HT", "Date reception"],
      },
    ],
  },
  {
    className: "Classe B",
    categories: [
      {
        name: "Categorie 1",
        attributes: ["Nom Fournisseur", "Date", "Numero BL"],
      },
      {
        name: "Categorie 2",
        attributes: ["Nom Client", "Montant Total", "Reference dossier"],
      },
    ],
  },
  {
    className: "Classe C",
    categories: [
      {
        name: "Categorie 3",
        attributes: ["Montant Total", "Date echeance", "Code dossier"],
      },
    ],
  },
];

export const ruleTemplates = [
  { label: "Est superieur a", inputLabel: "Valeur numerique", placeholder: "500" },
  { label: "Est inferieur a", inputLabel: "Valeur numerique", placeholder: "200" },
  { label: "Est egal a", inputLabel: "Valeur attendue", placeholder: "Dupont Jean" },
  { label: "Est avant le", inputLabel: "Date limite", placeholder: "01/01/2024" },
];

export const initialControlPoints = [
  {
    id: "cp-1",
    className: "Classe A",
    category: "Categorie 1",
    attribute: "Montant Total",
    ruleType: "Est superieur a",
    ruleValue: "500",
    rule: "Est superieur a 500",
  },
  {
    id: "cp-2",
    className: "Classe A",
    category: "Categorie 1",
    attribute: "Date",
    ruleType: "Est avant le",
    ruleValue: "01/01/2024",
    rule: "Est avant le 01/01/2024",
  },
  {
    id: "cp-3",
    className: "Classe B",
    category: "Categorie 2",
    attribute: "Nom Client",
    ruleType: "Est egal a",
    ruleValue: "Dupont Jean",
    rule: "Est egal a Dupont Jean",
  },
  {
    id: "cp-4",
    className: "Classe C",
    category: "Categorie 3",
    attribute: "Montant Total",
    ruleType: "Est inferieur a",
    ruleValue: "200",
    rule: "Est inferieur a 200",
  },
];
