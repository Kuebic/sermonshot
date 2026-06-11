# Context — SermonShot

Glossary for turning a sermon transcript into the content suite. Terms here are the
canonical names; use them in specs, prompts, and reviews.

## Terms

### Content suite
The seven outputs generated from one sermon transcript: blog, clip suggestions,
devotional, discussion guide, quotes and verses, social carousel, summaries.

### Transcript quirk
A spoken-word artifact in the transcript: false starts, stutters ("Your. Your
ability"), filler ("you know"), garbled transcription, off-the-cuff phrasing.
Quirks are random thoughts, not calculated expressions — they never appear in
running prose.

### Catchphrase
A line the pastor deliberately repeats or lands ("if it's good enough for Jesus,
it's good enough for me", "unbreakable faith and unbreakable families"). A
calculated expression, not a quirk — quotable verbatim anywhere, including prose
and carousel covers.

### Quote slot
A designated place in an output where verbatim pastor speech belongs: clip
excerpts and hooks, the quotes file, the devotional's Quote field. Everywhere
outside a quote slot, the pastor is paraphrased in polished prose.

### Embellishment
A natural extension of the sermon's point that the sermon doesn't literally say
(e.g. "memorize the verse" extending "use Scripture as your weapon"). Bounded by
the "would he nod?" test: the pastor would say "yes, that's what I meant" — never
"I didn't say that."

### Cover
The first slide of a social carousel. Short (≤8 words), pulls exactly one hook
trigger, specific and true to the sermon's point — never bait.

### Hook trigger
One of four attention mechanisms a hook or cover pulls: curiosity gap, pattern
interrupt, self-relevance, emotion/loss.

### Polish pass
The post-generation review of each output against the calibrated style rules.
Checklist plus targeted fixes only — a passing output is never touched, and no
output ever gets a blanket rewrite.
