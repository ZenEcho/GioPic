import fs from 'fs-extra'
import { getManifest } from '../src/manifest'
import { r } from './utils'

export async function writeManifest() {
  await fs.writeJSON(r('dist/manifest.json'), await getManifest(), { spaces: 2 })
}

writeManifest()
