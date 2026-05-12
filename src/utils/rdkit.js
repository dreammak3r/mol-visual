let rdkitModule = null
let loadingPromise = null

export function getRDKitModule() {
  if (rdkitModule) return Promise.resolve(rdkitModule)
  if (loadingPromise) return loadingPromise

  loadingPromise = new Promise((resolve, reject) => {
    if (window.RDKitModule) {
      rdkitModule = window.RDKitModule
      resolve(rdkitModule)
      return
    }
    const script = document.createElement('script')
    script.src = '/rdkit/RDKit_minimal.js'
    script.onload = () => {
      window.initRDKitModule().then(module => {
        rdkitModule = module
        window.RDKitModule = module
        resolve(module)
      }).catch(reject)
    }
    script.onerror = () => reject(new Error('Failed to load RDKit.js'))
    document.head.appendChild(script)
  })

  return loadingPromise
}

export function smilesToSVG(rdkit, smiles, width = 400, height = 300) {
  const mol = rdkit.get_mol(smiles)
  if (!mol) throw new Error(`Cannot parse SMILES: ${smiles}`)
  const svg = mol.get_svg(width, height)
  mol.delete()
  return svg
}

export function smilesToMolblock(rdkit, smiles) {
  const mol = rdkit.get_mol(smiles)
  if (!mol) throw new Error(`Cannot parse SMILES: ${smiles}`)
  const molblock = mol.get_molblock()
  mol.delete()
  return molblock
}

export function isRDKitReady() {
  return rdkitModule !== null
}