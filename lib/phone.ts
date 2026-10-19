import type { PhoneInfo, SearchResult } from './types.ts'
import parsePhoneNumberFromString, {
  type NumberFormat,
  type PhoneNumberType,
  getNumberType,
  isValidNumber,
  isPossibleNumber,
} from 'libphonenumber-js'

const COUNTRY_NAMES: Record<string, string> = {
  BR: 'Brasil',
  US: 'Estados Unidos',
  GB: 'Reino Unido',
  DE: 'Alemanha',
  FR: 'França',
  ES: 'Espanha',
  IT: 'Itália',
  PT: 'Portugal',
  AR: 'Argentina',
  MX: 'México',
  CO: 'Colômbia',
  CL: 'Chile',
  PE: 'Peru',
  VE: 'Venezuela',
  EC: 'Equador',
  BO: 'Bolívia',
  PY: 'Paraguai',
  UY: 'Uruguai',
}

const LINE_TYPE_MAP: Record<PhoneNumberType, string> = {
  FIXED_LINE: 'Fixo',
  MOBILE: 'Móvel',
  FIXED_LINE_OR_MOBILE: 'Fixo ou Móvel',
  TOLL_FREE: 'Gratuito',
  PREMIUM_RATE: 'Premium',
  SHARED_COST: 'Custo Compartilhado',
  VOIP: 'VoIP',
  PERSONAL_NUMBER: 'Número Pessoal',
  PAGER: 'Pager',
  UAN: 'UAN',
  VOICEMAIL: 'Voicemail',
}

export function parsePhoneNumber(phone: string, defaultCountry: string = 'BR'): PhoneInfo | null {
  try {
    const phoneNumber = parsePhoneNumberFromString(phone, defaultCountry as Parameters<typeof parsePhoneNumberFromString>[1])
    
    if (!phoneNumber) return null

    const countryCode = phoneNumber.country || defaultCountry
    const country = COUNTRY_NAMES[countryCode] || countryCode
    const lineType = phoneNumber.getType()
    
    return {
      number: phoneNumber.format('E.164' as NumberFormat),
      country_code: '+' + phoneNumber.countryCallingCode,
      national_number: phoneNumber.formatNational(),
      country,
      location: country,
      carrier: 'Indisponível',
      line_type: lineType ? LINE_TYPE_MAP[lineType] : 'Desconhecido',
      valid: phoneNumber.isValid(),
      possible: phoneNumber.isPossible(),
    }
  } catch {
    return null
  }
}

export function phoneInfoToSearchResult(phoneInfo: PhoneInfo): SearchResult {
  return {
    id: `phone-${phoneInfo.number.replace(/\D/g, '')}`,
    platform: 'Telefone',
    username: phoneInfo.number,
    displayName: phoneInfo.number,
    score: phoneInfo.valid ? 85 : 30,
    bio: `${phoneInfo.line_type} • ${phoneInfo.carrier} • ${phoneInfo.location}`,
    followers: '',
    following: '',
    location: phoneInfo.location,
    url: `tel:${phoneInfo.number}`,
    exists: phoneInfo.valid,
    status: phoneInfo.valid ? 'valid' : 'invalid',
    source: 'phonenumbers',
    timestamp: Date.now(),
    extra: {
      countryCode: phoneInfo.country_code,
      nationalNumber: phoneInfo.national_number,
      country: phoneInfo.country,
      carrier: phoneInfo.carrier,
      lineType: phoneInfo.line_type,
      valid: phoneInfo.valid,
      possible: phoneInfo.possible,
    },
  }
}

export function validatePhoneNumber(phone: string): boolean {
  try {
    const phoneNumber = parsePhoneNumberFromString(phone, 'BR')
    return phoneNumber ? phoneNumber.isValid() : false
  } catch {
    return false
  }
}