import { z } from 'zod'

// Validation of environment variables here
const envSchema = z.object({})

function parseEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('Failed to parse environment variables:', error)
    throw error
  }
}

export type Env = z.infer<typeof envSchema>
export const env = parseEnv()
