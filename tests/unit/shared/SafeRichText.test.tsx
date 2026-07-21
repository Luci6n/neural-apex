import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SafeRichText } from '../../../src/shared/ui/SafeRichText'

describe('SafeRichText', () => {
  it('removes raw markdown markers and renders structured paragraphs and bullets', () => {
    const html = renderToStaticMarkup(
      <SafeRichText text={'## **Race engineer**\nPredictor: Rain soon. - Scanner: Track dry.\n- Lesson: Compare both.'} />,
    )

    expect(html).not.toContain('**')
    expect(html).not.toContain('##')
    expect(html).toContain('<p>Race engineer</p>')
    expect(html).toContain('<li>Scanner: Track dry.</li>')
    expect(html).toContain('<li>Lesson: Compare both.</li>')
  })

  it('escapes model-supplied HTML instead of injecting it', () => {
    const html = renderToStaticMarkup(<SafeRichText text={'<script>alert("no")</script>'} />)
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })
})
