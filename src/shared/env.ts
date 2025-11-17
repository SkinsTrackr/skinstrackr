import { z } from 'zod'

// Validation of environment variables here
const envSchema = z.object({
  ITEMS_BASE_URL: z.string(),
  ICONS_BASE_URL: z.string(),

  ITEM_FILES: z
    .string()
    .default(
      'item_prices.json,charms.json,common_items.json,graffiti_tints.json,music_kits.json,paints.json,qualities.json,rarities.json,stickers.json'
    )
    .transform((val) => val.split(',')),

  // Default variables
  DATA_DIR: z.string().default('data'),
  QUALITY_DATA_PATH: z.string().default('data/qualities.json'),
  RARITY_DATA_PATH: z.string().default('data/rarities.json'),
  CHARM_DATA_PATH: z.string().default('data/charms.json'),
  COMMON_ITEM_DATA_PATH: z.string().default('data/common_items.json'),
  GRAFFITI_TINT_DATA_PATH: z.string().default('data/graffiti_tints.json'),
  PRICE_DATA_PATH: z.string().default('data/item_prices.json'),
  MUSIC_KIT_DATA_PATH: z.string().default('data/music_kits.json'),
  PAINT_DATA_PATH: z.string().default('data/paints.json'),
  STICKER_DATA_PATH: z.string().default('data/stickers.json')
})

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
