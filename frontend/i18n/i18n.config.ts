import nl from './nl'
import en from './en'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'nl',
  messages: {
    nl,
    en
  }
}))