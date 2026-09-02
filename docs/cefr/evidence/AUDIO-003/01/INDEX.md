# AUDIO-003 attempt 01 — evidence index

Tested implementation commit: 89b9ead (production files; the strengthened
detector test is committed as b07be82 — production files byte-identical
between the two). RED evidence was captured on the pristine accepted base
742553c1ff4da7f5e03afb8f427d368204807019. Final delivered SHA is returned in
the handoff message after push (not embedded in its own commit).

Environment: Debian, Node v24.19.0, npm 11.17.0, Python 3.12.14,
Playwright 1.61.x (chromium build 1228; projects: chromium, Mobile Chrome).
Setup events and infrastructure failures: see setup-events.txt.

| File | Command (exact) | Phase | Tested revision | Outcome | Size | SHA-256 |
|---|---|---|---|---|---|---|
| [baseline-words-audio-defect.txt](baseline-words-audio-defect.txt) | `npx playwright test tests/e2e/words-audio.spec.js --project=chromium / --project="Mobile Chrome"` | baseline | 742553c | 1 failed each (line 77: Expected 0, Received 1) | 2386 B | `a267545aaf527c94ac2a740385022441e67156fbdad26c3a38c31effb93e4a50` |
| [red-cefr-audio-chromium.log](red-cefr-audio-chromium.log) | `npx playwright test tests/e2e/cefr-audio.spec.js --project=chromium --timeout=8000` | RED | 742553c | 18 failed | 30512 B | `42fc0fa64c37eb656879054f73fe3ba1398d76822d7725f9d5c8659b8bc37d5e` |
| [red-cefr-audio-mobile.log](red-cefr-audio-mobile.log) | `npx playwright test tests/e2e/cefr-audio.spec.js --project="Mobile Chrome" --timeout=8000` | RED | 742553c | 18 failed | 30710 B | `f33c0d5d9945dd9f526559d2270e8b8f4d79663d638dcd27b659f56107ff5dad` |
| [red-words-audio-chromium.log](red-words-audio-chromium.log) | `npx playwright test tests/e2e/words-audio.spec.js --project=chromium --timeout=8000` | RED | 742553c | 4 failed / 1 passed | 6532 B | `1887137687e352b140bd87b46846729e42d84497afed07518b1b120644210107` |
| [red-words-audio-mobile.log](red-words-audio-mobile.log) | `npx playwright test tests/e2e/words-audio.spec.js --project="Mobile Chrome" --timeout=8000` | RED | 742553c | 4 failed / 1 passed | 6613 B | `a3b56a27c582a313f92fc7b12529629eec1bbd3d4d102809c784d20794f01105` |
| [iter1-cefr-audio-chromium.log](iter1-cefr-audio-chromium.log) | `npx playwright test tests/e2e/cefr-audio.spec.js --project=chromium` | iteration | 89b9ead (uncommitted tree) | 10 passed / 8 failed | 19755 B | `8764837c9790acff662fe7de1c4d2cbb33a782d856ef50245b7310b9bb6b59bf` |
| [iter2-cefr-audio-chromium.log](iter2-cefr-audio-chromium.log) | `npx playwright test tests/e2e/cefr-audio.spec.js --project=chromium` | iteration | 89b9ead (uncommitted tree) | 13 passed / 5 failed | 12066 B | `4f783c287fd1932cebe6b0d81d4e69b825c62ed6c4f55bfc372dd2b95ebbc6eb` |
| [iter3-cefr-audio-chromium.log](iter3-cefr-audio-chromium.log) | `npx playwright test tests/e2e/cefr-audio.spec.js --project=chromium` | iteration | 89b9ead (uncommitted tree) | 18 passed | 4364 B | `facd35914fff9e0db1dab0e22625a55aed244e76c73c13d66e02d35e3d8007bf` |
| [iter1-words-audio-chromium.log](iter1-words-audio-chromium.log) | `npx playwright test tests/e2e/words-audio.spec.js --project=chromium` | iteration | 89b9ead (uncommitted tree) | 5 passed | 1084 B | `aa81893083c51c79bd3ab8d41d8c65747690f851a2af3156b0484700c54921f9` |
| [ladder3-units.log](ladder3-units.log) | `npm run test:units` | ladder | 89b9ead | 155/155 | 16492 B | `ba1551296d277a10a6465c99ba441fd33cd6a759fcad014a5a479e154694714a` |
| [ladder4-cefr-audio-chromium.log](ladder4-cefr-audio-chromium.log) | `npx playwright test tests/e2e/cefr-audio.spec.js --project=chromium` | ladder | 89b9ead | 18/18 | 4372 B | `9955ae06696d7fd02c403fe0bbe0f7d88f31e0ae69a91147f5f5a0ce8e1eacea` |
| [ladder5-cefr-audio-mobile.log](ladder5-cefr-audio-mobile.log) | `npx playwright test tests/e2e/cefr-audio.spec.js --project="Mobile Chrome"` | ladder | 89b9ead | 18/18 | 4463 B | `862af61a0149bd397a888ad4c9418ecb3cfbce559473b734466a5e4f65d72287` |
| [ladder6-words-audio-both.log](ladder6-words-audio-both.log) | `npx playwright test tests/e2e/words-audio.spec.js` | ladder | 89b9ead | 10/10 | 2160 B | `8c02149f76c611af131c193fb4e7c85c299a7aa5d7f0937bf8eb953cd6a9f5ae` |
| [ladder7-phrases-conversations.log](ladder7-phrases-conversations.log) | `npx playwright test tests/e2e/phrases-conversations.spec.js` | ladder | 89b9ead | 23 passed / 1 skipped (paired mobile-only test) | 4960 B | `9b24a5cc2802543fd56da459009a4e090e2799566fb2990be8c06c3f05ab9f8d` |
| [ladder8-favorites-srs.log](ladder8-favorites-srs.log) | `npx playwright test tests/e2e/favorites-filters.spec.js tests/e2e/srs.spec.js` | ladder | 89b9ead | 4/4 | 3744 B | `96a4c194a2204eeddf2e8a4da9e5209af7bc7304e21e783ee9062286ee4e6a4a` |
| [ladder9-verbs-audio.log](ladder9-verbs-audio.log) | `npx playwright test tests/e2e/verbs-audio.spec.js` | ladder | 89b9ead | 32/32 | 8260 B | `ef1fbee01029cd6bfc0c8bee3cc5543c80291b25290bbb543b4b6c259deea3e0` |
| [ladder10-full-chromium.log](ladder10-full-chromium.log) | `npx playwright test --project=chromium` | ladder | 89b9ead | 182 passed / 1 skipped | 46987 B | `fee1be1f65ded216c6b559bc2241c1e326ecd81d8055c10f0149e7d84d396730` |
| [ladder10-full-mobile.log](ladder10-full-mobile.log) | `npx playwright test --project="Mobile Chrome"` | ladder | 89b9ead | 182 passed / 1 failed (verbs.spec.js:33, known Mobile flake) | 49483 B | `5ad722e22f76713908c8b85be08fea111ebf724fc180f3506835705c5c58e9ac` |
| [ladder10-isolate-verbs-mobile.log](ladder10-isolate-verbs-mobile.log) | `npx playwright test tests/e2e/verbs.spec.js --project="Mobile Chrome" --grep "custom Auto-Play Audio sequence"` | ladder/isolation | 89b9ead | 1 passed (1.8s) | 465 B | `f477bc45066ea46d2f9c83becfb0fce22b2864fcbc0500ef0cec300df7abcc54` |
| [ladder10-verbs-mobile-rerun.log](ladder10-verbs-mobile-rerun.log) | `npx playwright test tests/e2e/verbs.spec.js --project="Mobile Chrome"` | ladder/rerun | 89b9ead | 5/5 | 1375 B | `4a0079753bc08e7365ed7da494e4104a8e4d42657d57452050002f300a506f2f` |
| [ladder10-full-mobile-rerun.log](ladder10-full-mobile-rerun.log) | `npx playwright test --project="Mobile Chrome"` | ladder/rerun | 89b9ead | 183/183 | 47906 B | `547537bb08f7332cde0af8e62682c0f213c371da5d07633a771b7ca102a5eb85` |
| [probe-P1-baseline.log](probe-P1-baseline.log) | `playwright cefr-audio --grep "B2 mixed cards" chromium, probe copy` | probe | 89b9ead | passed | 2795 B | `9c744606e511987354bc7fe386258828a399c3837620471191b7ba3eb1370475` |
| [probe-P1-mutant.log](probe-P1-mutant.log) | `same, tts.js ar mislabeled en` | probe | 89b9ead mutant | failed -> KILLED | 4680 B | `efcd88ea8f657f1eca2cb002effa34e2362f865002191a7d834fc2c3cbc347f3` |
| [probe-P2-baseline.log](probe-P2-baseline.log) | `playwright cefr-audio --grep "unit navigation cancels" chromium, probe copy` | probe | 89b9ead | passed | 2812 B | `c10a8a42c015eb7ac194c55a706ac891dd16fd840f3503dfa75bc18f7c942af3` |
| [probe-P2-mutant.log](probe-P2-mutant.log) | `same, app.js flat vocabulary scope` | probe | 89b9ead mutant | failed -> KILLED | 4073 B | `88654d8fcd27da2b14d4707ab05724dc07edf9eadd6c436dffe7b116dec9e2d6` |
| [probe-P3-baseline.log](probe-P3-baseline.log) | `playwright cefr-audio --grep "tab changes cancel" chromium, probe copy` | probe | 89b9ead | passed | 3032 B | `bb78d55751f07229bb098d77cf438150e30098cbea6669b731cf4a633b252fce` |
| [probe-P3-mutant.log](probe-P3-mutant.log) | `same, switchUnitTab stop removed` | probe | 89b9ead mutant | failed -> KILLED | 4663 B | `3f3a6f13c331794817d31eedb23031a617d0b1bc7cf2a4eb1c40c7c981ba57e9` |
| [probe-P4-baseline.log](probe-P4-baseline.log) | `playwright cefr-audio --grep "active vocabulary filter" chromium, probe copy` | probe | 89b9ead | passed | 2799 B | `62dba87cf02bdbedc458f4d68ea4182c1057b4b110512571d95b66879db0f166` |
| [probe-P4-mutant.log](probe-P4-mutant.log) | `same, app.js whole-unit scope` | probe | 89b9ead mutant | failed -> KILLED | 4324 B | `66a4d3bbfe6af9f0a3b93f0185d6bfda7a557f6cd564fc310e817b0d92a75f26` |
| [probe-P5-baseline.log](probe-P5-baseline.log) | `playwright cefr-audio --grep "rapid queue replacement" chromium, probe copy` | probe | 89b9ead | passed | 2922 B | `fd0d55d45c5ea3d93202b98de1c3e35560dd90028272741fb75744c21df2b385` |
| [probe-P5-mutant.log](probe-P5-mutant.log) | `same, two-layer onend guard removed` | probe | 89b9ead mutant | passed -> SURVIVED (test-strength cycle followed) | 2922 B | `8f1e881115c5dda902a366001da5b3bb35ec9b3aa3c0772145584ec3e70730aa` |
| [probe-P5-baseline-strengthened.log](probe-P5-baseline-strengthened.log) | `same grep, strengthened spec` | probe | 89b9ead + strengthened test | passed | 2922 B | `c647d79747071cc8adf29bed985c093ca23ac434f491ffe696a46781ae086acf` |
| [probe-P5-mutant-strengthened.log](probe-P5-mutant-strengthened.log) | `same, two-layer onend guard removed` | probe | 89b9ead + strengthened test, mutant | failed -> KILLED | 4080 B | `ebdfd21ff6a53d943a24566bf39ed848d0b7580ce22dbbc8fc3087007d6e0491` |
| [probe-P6-baseline.log](probe-P6-baseline.log) | `playwright words-audio --grep "highlights rows and respects filters" chromium, probe copy` | probe | 89b9ead | passed | 2741 B | `b53b18da1eb0da36761b1ebe500402ad81f18205b130c880893e86995d27ad1c` |
| [probe-P6-mutant.log](probe-P6-mutant.log) | `same, stopAudioQueue highlight clear removed` | probe | 89b9ead mutant | failed -> KILLED | 3684 B | `ed91cc59c2ac6ea4530ef90c91f77c9fdad92e2f957f6d2e49a0b9c71281b3c4` |
| [final-units.log](final-units.log) | `npm run test:units` | final | b07be82 | 155/155 | 16492 B | `47c6f4987de08633e7d999b5dfd4bb0236c206a51eb66129fb76388baf306e67` |
| [final-cefr-audio-chromium.log](final-cefr-audio-chromium.log) | `npx playwright test tests/e2e/cefr-audio.spec.js --project=chromium` | final | b07be82 | 18/18 | 4371 B | `30685ecc04e40d9d810fc763d1a0eb1c46f45988a9670cb548cff2054513831f` |
| [final-cefr-audio-mobile.log](final-cefr-audio-mobile.log) | `npx playwright test tests/e2e/cefr-audio.spec.js --project="Mobile Chrome"` | final | b07be82 | 18/18 | 4460 B | `cc86fc9c2ccc91c38f77c8d8c5e9122dcb99163270ee67b1de0bb1b3f718f4e3` |
| [final-full-chromium.log](final-full-chromium.log) | `npx playwright test --project=chromium` | final | b07be82 | 182 passed / 1 skipped | 46978 B | `3fe1191326fe50dd43c0fab146d7137a43aa8065693323a80debbd6a120436aa` |
| [final-full-mobile.log](final-full-mobile.log) | `npx playwright test --project="Mobile Chrome"` | final | b07be82 | 183/183 | 47608 B | `db3c83fea0e8000d447fa097f14627c202d131e106c1475cfe743d594d9fabf5` |

Notes:
- iter1/iter2 logs record the intermediate failing states of the new suite
  during stabilization (harness fixes only; no production change between
  iter1 and iter3).
- ladder10-full-mobile.log contains the single verbs.spec.js:33 Mobile
  Chrome failure (known flake family F-A002C1-2/SC-INFRA-01 from the
  AUDIO-002-C1 delivery); isolation and rerun logs prove it transient.
- probe-P5-* logs document the full TS-MUT-005 cycle: the original
  detector let the guard-removal mutant survive; the strengthened detector
  (committed b07be82) kills it and passes on unmodified production code.
- All files scanned for credential patterns: zero hits.
