export const molecules = [
  {
    id: 'aspirin',
    name: 'Aspirin',
    smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O',
    formula: 'C9H8O4',
    sdfPath: '/sdf/aspirin.sdf',
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    smiles: 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O',
    formula: 'C13H18O2',
    sdfPath: '/sdf/ibuprofen.sdf',
  },
  {
    id: 'caffeine',
    name: 'Caffeine',
    smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
    formula: 'C8H10N4O2',
    sdfPath: '/sdf/caffeine.sdf',
  },
  {
    id: 'paracetamol',
    name: 'Paracetamol',
    smiles: 'CC(=O)NC1=CC=C(C=C1)O',
    formula: 'C8H9NO2',
    sdfPath: '/sdf/paracetamol.sdf',
  },
]

export const proteins = [
  {
    id: 'crambin',
    name: 'Crambin',
    pdbId: '1CRN',
    pdbPath: '/pdb/1CRN.pdb',
    description: 'Small plant protein (46 residues)',
  },
  {
    id: 'b-dna',
    name: 'B-DNA (Dodecamer)',
    pdbId: '1BNA',
    pdbPath: '/pdb/1BNA.pdb',
    description: 'B-DNA double helix, 12 base pairs',
  },
  {
    id: 'estrogen-receptor',
    name: 'Estrogen Receptor',
    pdbId: '2I0B',
    pdbPath: '/pdb/2I0B.pdb',
    description: 'ER-alpha ligand binding domain (609 KB)',
    ligandSmiles: 'C1=CC=C2C(=C1)C(=O)NC2=O',
  },
]