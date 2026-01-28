import log from 'electron-log'
import { z } from 'zod'

// Validation of environment variables here
const envSchema = z.object({
  // Default variables
  ITEMS_BASE_URL: z.string().default('https://cs-items.skinstrackr.com'),
  ICONS_BASE_URL: z.string().default('https://cs-icons.skinstrackr.com'),

  ITEM_FILES: z
    .string()
    .default(
      'item_prices.json,charms.json,common_items.json,graffiti_tints.json,music_kits.json,paints.json,qualities.json,rarities.json,stickers.json,highlights.json'
    )
    .transform((val) => val.split(',')),

  DATA_DIR: z.string().default('data'),
  QUALITY_DATA_PATH: z.string().default('data/qualities.json'),
  RARITY_DATA_PATH: z.string().default('data/rarities.json'),
  CHARM_DATA_PATH: z.string().default('data/charms.json'),
  COMMON_ITEM_DATA_PATH: z.string().default('data/common_items.json'),
  GRAFFITI_TINT_DATA_PATH: z.string().default('data/graffiti_tints.json'),
  PRICE_DATA_PATH: z.string().default('data/item_prices.json'),
  MUSIC_KIT_DATA_PATH: z.string().default('data/music_kits.json'),
  PAINT_DATA_PATH: z.string().default('data/paints.json'),
  STICKER_DATA_PATH: z.string().default('data/stickers.json'),
  HIGHLIGHT_DATA_PATH: z.string().default('data/highlights.json'),

  GOOGLE_FORMS_URL: z.string().default('https://forms.gle/qxTKNiW6Bra95xnf7'),
  DISCORD_INVITE_URL: z.string().default('https://discord.com/invite/Rmu3fGKGyu'),
  GITHUB_REPO_URL: z.string().default('https://github.com/SkinsTrackr/skinstrackr')
})

function parseEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    log.error('Failed to parse environment variables:', error)
    throw error
  }
}

export type Env = z.infer<typeof envSchema>
export const env = parseEnv()
