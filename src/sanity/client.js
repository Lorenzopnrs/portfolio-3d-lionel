import { createClient } from '@sanity/client'
import {
  SANITY_API_VERSION,
  SANITY_DATASET,
  SANITY_PROJECT_ID,
} from './config.js'

export const sanityClient = createClient({
  apiVersion: SANITY_API_VERSION,
  dataset: SANITY_DATASET,
  projectId: SANITY_PROJECT_ID,
  perspective: 'published',
  useCdn: true,
})
