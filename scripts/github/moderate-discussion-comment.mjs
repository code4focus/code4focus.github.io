import { appendFileSync, readFileSync } from 'node:fs'
import process from 'node:process'

const TRUSTED_AUTHOR_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR'])

const PROMOTIONAL_PHRASES = [
  'guest post',
  'backlink',
  'seo service',
  'seo services',
  'domain authority',
  'boost traffic',
  'traffic boost',
  'buy followers',
  'casino',
  'sportsbook',
  'betting',
  'loan offer',
  'forex signal',
  'forex signals',
  'airdrop',
  'token presale',
  'guaranteed returns',
  'investment plan',
  'recover your funds',
  'recovery service',
  '代写',
  '引流',
  '博彩',
  '娱乐城',
  '棋牌',
  '贷款',
]

const CONTACT_HOOKS = [
  'telegram',
  'whatsapp',
  'wechat',
  'contact me',
  'contact us',
  'email me',
  'reach me',
  'dm me',
  '加微信',
  '联系我',
]

const ABUSE_PHRASES = [
  'seed phrase',
  'private key',
  'wallet connect',
  'walletconnect',
  'verify your wallet',
  'verify your account',
  'password reset',
  '2fa code',
  'two-factor code',
  'login to claim',
  'remote access',
  'download this app',
  'install this extension',
  '助记词',
  '私钥',
  '验证码',
  '钱包验证',
]

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>()]+/gi
const EMAIL_PATTERN = /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\u200B/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function collectMatches(text, phrases) {
  return phrases.filter(phrase => text.includes(phrase))
}

function toActionValue(value) {
  return String(value ?? '')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .trim()
}

function writeOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) {
    return
  }

  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${toActionValue(value)}\n`)
}

function writeSummary(lines) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return
  }

  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`)
}

function getDecision(comment) {
  const body = String(comment.body ?? '')
  const normalizedBody = normalizeText(body)
  const authorAssociation = String(comment.author_association ?? 'NONE').toUpperCase()
  const subjectId = String(comment.node_id ?? '')
  const commentUrl = String(comment.html_url ?? '')
  const urlCount = (normalizedBody.match(URL_PATTERN) ?? []).length
  const emailCount = (normalizedBody.match(EMAIL_PATTERN) ?? []).length
  const promotionalMatches = collectMatches(normalizedBody, PROMOTIONAL_PHRASES)
  const contactMatches = collectMatches(normalizedBody, CONTACT_HOOKS)
  const abuseMatches = collectMatches(normalizedBody, ABUSE_PHRASES)
  const destinationCount = urlCount + emailCount

  const baseDecision = {
    shouldMinimize: false,
    classifier: '',
    reason: '',
    commentUrl,
    subjectId,
    authorAssociation,
    urlCount,
    emailCount,
    matchedTerms: [],
  }

  if (!normalizedBody) {
    return {
      ...baseDecision,
      reason: 'Comment body is empty after normalization.',
    }
  }

  if (!subjectId) {
    return {
      ...baseDecision,
      reason: 'Comment payload did not include a GraphQL node id.',
    }
  }

  if (TRUSTED_AUTHOR_ASSOCIATIONS.has(authorAssociation)) {
    return {
      ...baseDecision,
      reason: `Skipping trusted author association: ${authorAssociation}.`,
    }
  }

  const looksLikeAbuse = abuseMatches.length > 0 && destinationCount > 0
  const looksLikeSpam
    = (promotionalMatches.length >= 2 && (destinationCount > 0 || contactMatches.length > 0))
      || (promotionalMatches.length > 0 && contactMatches.length > 0 && destinationCount > 0)
      || (promotionalMatches.length > 0 && urlCount >= 2)

  if (looksLikeAbuse) {
    return {
      ...baseDecision,
      shouldMinimize: true,
      classifier: 'ABUSE',
      reason: 'Matched obvious phishing, credential, or malware bait with an external destination.',
      matchedTerms: [...new Set([...abuseMatches, ...contactMatches])],
    }
  }

  if (looksLikeSpam) {
    return {
      ...baseDecision,
      shouldMinimize: true,
      classifier: 'SPAM',
      reason: 'Matched obvious ad or scam phrasing with promotional links or contact hooks.',
      matchedTerms: [...new Set([...promotionalMatches, ...contactMatches])],
    }
  }

  return {
    ...baseDecision,
    reason: 'No narrow spam or abuse rule matched.',
    matchedTerms: [...new Set([...promotionalMatches, ...abuseMatches, ...contactMatches])],
  }
}

function readEventPayload() {
  const eventPath = process.env.GITHUB_EVENT_PATH

  if (!eventPath) {
    throw new Error('GITHUB_EVENT_PATH is required.')
  }

  return JSON.parse(readFileSync(eventPath, 'utf8'))
}

const payload = readEventPayload()
const decision = getDecision(payload.comment ?? {})

writeOutput('should_minimize', decision.shouldMinimize)
writeOutput('classifier', decision.classifier)
writeOutput('match_reason', decision.reason)
writeOutput('subject_id', decision.subjectId)
writeOutput('comment_url', decision.commentUrl)
writeOutput('matched_terms', decision.matchedTerms.join(', '))

writeSummary([
  '## Discussion comment moderation',
  '',
  `- Comment: ${decision.commentUrl || 'n/a'}`,
  `- Author association: ${decision.authorAssociation}`,
  `- URL count: ${decision.urlCount}`,
  `- Email count: ${decision.emailCount}`,
  `- Matched terms: ${decision.matchedTerms.join(', ') || 'none'}`,
  `- Decision: ${decision.shouldMinimize ? `minimize as ${decision.classifier}` : 'no action'}`,
  `- Reason: ${decision.reason}`,
])

if (!decision.shouldMinimize) {
  process.exit(0)
}
